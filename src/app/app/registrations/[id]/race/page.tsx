"use client"
import { useEffect, useState, useRef, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, Navigation, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ActiveRacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sosSent, setSosSent] = useState(false)
  const [sosReason, setSosReason] = useState<string | null>(null)
  const supabase = createClient()
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.")
      return
    }

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setPosition(pos)
        // Enviar a Supabase
        await supabase.from('gps_positions').insert({
          registration_id: id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_meters: pos.coords.accuracy,
          speed_mps: pos.coords.speed,
          heading: pos.coords.heading,
          device_timestamp: new Date(pos.timestamp).toISOString()
        })
      },
      (err) => {
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    )

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [id, supabase])

  const handleSos = async (reason: string) => {
    if (!position) return;
    
    // Obtener event_id de la registration
    const { data: reg } = await supabase.from('registrations').select('event_id').eq('id', id).single()
    if (!reg) return;

    await supabase.from('alerts').insert({
      event_id: reg.event_id,
      registration_id: id,
      type: 'SOS',
      sos_reason: reason,
      title: `SOS: ${reason}`,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    })

    setSosSent(true)
    setTimeout(() => setSosSent(false), 5000)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md mb-4 text-center">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          <Navigation className="h-5 w-5 text-green-400" />
          Rastreo Activo
        </h2>
        <p className="text-slate-400 text-sm mt-1">Tu ubicación se está compartiendo con la organización.</p>
      </div>

      <div className="flex-1 bg-white border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
        {error ? (
          <div className="text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p>Error de GPS: {error}</p>
          </div>
        ) : position ? (
          <div>
            <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="font-mono text-lg mb-2">
              {position.coords.latitude.toFixed(6)}, {position.coords.longitude.toFixed(6)}
            </p>
            <p className="text-sm text-slate-500">
              Precisión: ±{Math.round(position.coords.accuracy)}m
            </p>
            <p className="text-xs text-slate-400 mt-4">
              Última actualización: {new Date(position.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <p className="text-slate-500 animate-pulse">Obteniendo ubicación GPS...</p>
        )}
      </div>

      <div className="mt-4 bg-red-50 border border-red-200 p-6 rounded-xl shadow-sm">
        <h3 className="text-red-800 font-bold text-center mb-4 flex items-center justify-center">
          <AlertCircle className="mr-2 h-5 w-5" /> SOLICITAR AYUDA
        </h3>
        
        {sosSent ? (
          <div className="bg-red-600 text-white p-4 rounded-lg text-center font-bold">
            ¡Alerta SOS enviada a la organización!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="destructive" onClick={() => handleSos("Lesión")}>Lesión</Button>
            <Button variant="destructive" onClick={() => handleSos("Agotamiento")}>Agotamiento</Button>
            <Button variant="destructive" onClick={() => handleSos("Me perdí")}>Me perdí</Button>
            <Button variant="destructive" onClick={() => handleSos("Otro")}>Otro</Button>
          </div>
        )}
      </div>
    </div>
  )
}
