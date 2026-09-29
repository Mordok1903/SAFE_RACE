"use client"
import dynamic from "next/dynamic"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Map, Save, Undo } from "lucide-react"

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false, loading: () => <div className="h-[500px] w-full bg-slate-100 flex items-center justify-center text-slate-400">Cargando mapa...</div> })

export default function RouteConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [points, setPoints] = useState<{lat: number, lng: number}[]>([])
  const [routeId, setRouteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadRoute() {
      setLoading(true)
      const { data: route } = await supabase.from('event_routes').select('id').eq('event_id', id).eq('is_active', true).single()
      
      if (route) {
        setRouteId(route.id)
        const { data: pts } = await supabase.from('route_points').select('latitude, longitude').eq('route_id', route.id).order('sequence')
        if (pts) {
          setPoints(pts.map(p => ({ lat: p.latitude, lng: p.longitude })))
        }
      }
      setLoading(false)
    }
    loadRoute()
  }, [id, supabase])

  const handleMapClick = (latlng: {lat: number, lng: number}) => {
    setPoints([...points, latlng])
  }

  const handleUndo = () => {
    setPoints(points.slice(0, -1))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Crear nueva ruta o usar la existente si no queremos historiar
    // Para simplificar, desactivamos las anteriores y creamos una nueva.
    await supabase.from('event_routes').update({ is_active: false }).eq('event_id', id)
    
    const { data: newRoute } = await supabase.from('event_routes').insert({
      event_id: id,
      is_active: true,
      created_by: user?.id,
      name: `Ruta ${new Date().toLocaleDateString()}`
    }).select('id').single()

    if (newRoute) {
      setRouteId(newRoute.id)
      
      // 2. Insertar puntos
      const inserts = points.map((p, i) => ({
        route_id: newRoute.id,
        sequence: i + 1,
        latitude: p.lat,
        longitude: p.lng
      }))

      if (inserts.length > 0) {
        await supabase.from('route_points').insert(inserts)
      }
    }
    
    setSaving(false)
    alert("Ruta guardada correctamente")
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Map className="h-6 w-6 mr-2 text-blue-600" /> Constructor de Ruta
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUndo} disabled={points.length === 0 || saving}>
            <Undo className="h-4 w-4 mr-2" /> Deshacer Punto
          </Button>
          <Button onClick={handleSave} disabled={points.length === 0 || saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : "Guardar Ruta"}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4 text-sm text-blue-900">
        Haz clic en el mapa para dibujar la ruta de la carrera (Polyline). El corredor amarillo representa la zona de tolerancia.
      </div>

      <div className="border rounded-xl overflow-hidden shadow-sm">
        <RouteMap points={points} onMapClick={handleMapClick} />
      </div>
    </div>
  )
}
