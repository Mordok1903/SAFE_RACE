"use client"
import dynamic from "next/dynamic"
import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Activity, AlertTriangle } from "lucide-react"

const Map = dynamic(() => import("@/components/Map"), { ssr: false, loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Cargando mapa...</div> })

export default function LiveDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [participants, setParticipants] = useState<any[]>([])
  const [routePoints, setRoutePoints] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // Cargar ruta
      const { data: route } = await supabase.from('event_routes').select('id').eq('event_id', id).eq('is_active', true).single()
      if (route) {
        const { data: points } = await supabase.from('route_points').select('*').eq('route_id', route.id).order('sequence')
        setRoutePoints(points || [])
      }

      // Cargar alertas activas
      const { data: activeAlerts } = await supabase.from('alerts').select('*').eq('event_id', id).in('status', ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'])
      setAlerts(activeAlerts || [])

      // Cargar participantes y su última posición
      const { data: regs } = await supabase.from('registrations')
        .select('id, participant_code, race_status, profiles!registrations_participant_id_fkey(first_name, last_name)')
        .eq('event_id', id)
        .in('race_status', ['RACING', 'STARTED', 'FINISHED', 'SAFE'])
      
      if (regs) {
        const mapped = await Promise.all(regs.map(async (r) => {
          const { data: pos } = await supabase.from('gps_positions')
            .select('latitude, longitude, device_timestamp')
            .eq('registration_id', r.id)
            .order('device_timestamp', { ascending: false })
            .limit(1)
            .single()

          return {
            id: r.id,
            code: r.participant_code,
            name: `${(r.profiles as any)?.first_name} ${(r.profiles as any)?.last_name}`,
            status: r.race_status,
            lat: pos?.latitude,
            lng: pos?.longitude,
            timestamp: pos?.device_timestamp
          }
        }))
        setParticipants(mapped.filter(p => p.lat))
      }
    }
    
    loadData()

    // Configurar realtime
    const channel = supabase.channel('live-map')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gps_positions' }, (payload) => {
        // En un MVP real actualizaríamos la posición específica. Aquí recargamos para simplicidad.
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center">
          <Activity className="h-6 w-6 mr-2 text-blue-600" /> Mapa en Vivo
        </h2>
        <div className="flex gap-4">
          <span className="flex items-center text-sm font-medium">
            <span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span> Corredores ({participants.length})
          </span>
          <span className="flex items-center text-sm font-medium">
            <span className="w-3 h-3 rounded-full bg-red-600 mr-2 animate-pulse"></span> Alertas ({alerts.length})
          </span>
        </div>
      </div>
      
      <div className="flex-1 flex gap-4">
        <div className="flex-1">
          <Map participants={participants} routePoints={routePoints} alerts={alerts} />
        </div>
        
        {/* Panel lateral de Alertas rápidas */}
        {alerts.length > 0 && (
          <div className="w-80 bg-white border rounded-xl shadow-sm p-4 overflow-y-auto">
            <h3 className="font-bold text-red-700 flex items-center mb-4 border-b pb-2">
              <AlertTriangle className="h-5 w-5 mr-2" /> Alertas Activas
            </h3>
            <div className="space-y-3">
              {alerts.map(a => {
                const p = participants.find(part => part.id === a.registration_id)
                return (
                  <div key={a.id} className="bg-red-50 p-3 rounded border border-red-100 text-sm">
                    <p className="font-bold text-slate-800">{p?.name || 'Corredor'}</p>
                    <p className="font-mono text-xs text-blue-700 mb-1">{p?.code}</p>
                    <p className="font-medium text-red-600">{a.type === 'SOS' ? `SOS: ${a.sos_reason}` : a.type}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(a.created_at).toLocaleTimeString()}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
