import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"

export default async function EventSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()

  async function publishEvent() {
    "use server"
    const supabaseServer = await createClient()
    await supabaseServer.from('events').update({ status: 'PUBLISHED' }).eq('id', id)
    revalidatePath(`/organizer/events/${id}/settings`)
  }

  async function startRace() {
    "use server"
    const supabaseServer = await createClient()
    await supabaseServer.from('events').update({ status: 'ACTIVE' }).eq('id', id)
    revalidatePath(`/organizer/events/${id}/settings`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Configuración del Evento</h2>
      
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
        <div>
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Estado del Evento</h3>
          <p className="mb-4">El estado actual es: <strong className="bg-slate-100 px-2 py-1 rounded">{event?.status}</strong></p>
          
          <div className="flex gap-4">
            {event?.status === 'DRAFT' && (
              <form action={publishEvent}>
                <Button type="submit">Publicar Evento</Button>
              </form>
            )}
            
            {(event?.status === 'PUBLISHED' || event?.status === 'READY') && (
              <form action={startRace}>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">Activar Carrera (En Vivo)</Button>
              </form>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Reglas del Motor de Alertas (MVP)</h3>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>Tolerancia de desvío de ruta: <strong>{event?.route_tolerance_meters} metros</strong></li>
            <li>Tiempo de desvío: <strong>{event?.deviation_time_seconds} segundos</strong></li>
            <li>Tiempo estacionario: <strong>{event?.stationary_time_seconds} segundos</strong></li>
            <li>Sin GPS por: <strong>{event?.no_gps_time_seconds} segundos</strong></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
