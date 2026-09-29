"use client"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Activity, MapPin } from "lucide-react"

export default function DemoSimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadRacers() {
      const { data } = await supabase.from('registrations')
        .select('*, profiles!registrations_participant_id_fkey(first_name, last_name)')
        .eq('event_id', id)
        .eq('race_status', 'RACING')
      
      setParticipants(data || [])
    }
    loadRacers()
  }, [id, supabase])

  const injectPosition = async (regId: string, lat: number, lng: number) => {
    setLoading(true)
    await supabase.from('gps_positions').insert({
      registration_id: regId,
      latitude: lat,
      longitude: lng,
      accuracy_meters: 5,
      device_timestamp: new Date().toISOString()
    })
    setLoading(false)
    alert("Posición inyectada")
  }

  const triggerAlertEval = async () => {
    setLoading(true)
    const res = await fetch('/api/alerts/evaluate', {
      method: 'POST',
      body: JSON.stringify({ event_id: id }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    setLoading(false)
    alert(`Evaluación completada. Alertas nuevas: ${data.alertsCreated || 0}`)
  }

  return (
    <div className="max-w-2xl mx-auto border p-6 rounded-xl bg-white shadow-sm border-amber-300">
      <h2 className="text-xl font-bold text-amber-700 mb-2 flex items-center">
        <Activity className="mr-2" /> Modo Demostración
      </h2>
      <p className="text-sm text-slate-600 mb-6">Esta pantalla es exclusiva para desarrollo. Permite inyectar puntos GPS y forzar la evaluación de alertas.</p>
      
      <div className="mb-6">
        <Button onClick={triggerAlertEval} disabled={loading} className="w-full bg-slate-800">
          Forzar Evaluación de Alertas (Cron simulado)
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold">Corredores Activos</h3>
        {participants.length === 0 && <p className="text-sm text-slate-500">No hay corredores en estado RACING.</p>}
        {participants.map(p => (
          <div key={p.id} className="border p-4 rounded-lg bg-slate-50">
            <p className="font-bold mb-2">{p.profiles.first_name} {p.participant_code}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => injectPosition(p.id, -12.046, -77.042)}>
                <MapPin className="h-4 w-4 mr-1"/> Lima Centro
              </Button>
              <Button size="sm" variant="outline" onClick={() => injectPosition(p.id, -12.121, -77.029)}>
                <MapPin className="h-4 w-4 mr-1"/> Miraflores (Desvío)
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
