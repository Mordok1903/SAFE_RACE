import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Flag, ShieldCheck } from "lucide-react"
import { revalidatePath } from "next/cache"

export default async function FinishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Traer corredores en competencia
  const { data: racing } = await supabase
    .from('registrations')
    .select('*, profiles!registrations_participant_id_fkey(first_name, last_name)')
    .eq('event_id', id)
    .eq('race_status', 'RACING')
    .order('start_at', { ascending: true })

  // Traer corredores que ya cruzaron la meta
  const { data: finished } = await supabase
    .from('registrations')
    .select('*, profiles!registrations_participant_id_fkey(first_name, last_name)')
    .eq('event_id', id)
    .eq('race_status', 'FINISHED')
    .order('finish_at', { ascending: false })

  async function simulateFinish(formData: FormData) {
    "use server"
    const regId = formData.get("regId") as string
    const eventId = formData.get("eventId") as string
    
    const supabaseServer = await createClient()
    
    // Simular cruce en meta
    await supabaseServer.from('finish_events').insert({
      event_id: eventId,
      registration_id: regId,
      source: 'SIMULATOR',
      status: 'VALIDATED'
    })

    // Actualizar estado
    await supabaseServer.from('registrations').update({
      race_status: 'FINISHED',
      finish_at: new Date().toISOString()
    }).eq('id', regId)

    revalidatePath(`/organizer/events/${eventId}/finish`)
  }

  async function markSafe(formData: FormData) {
    "use server"
    const regId = formData.get("regId") as string
    const eventId = formData.get("eventId") as string
    
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    // Marcar como seguro
    await supabaseServer.from('registrations').update({
      race_status: 'SAFE',
      safe_closed_at: new Date().toISOString(),
      safe_closed_by: user?.id
    }).eq('id', regId)

    revalidatePath(`/organizer/events/${eventId}/finish`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Meta y Cierre Seguro</h2>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-8 text-sm text-blue-900">
        <p><strong>Meta Simulada:</strong> Para el MVP web, el cruce de meta se simula manualmente desde esta pantalla. En producción esto será reemplazado por la detección automática (Cámara + ESP32).</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold border-b pb-2 mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-blue-600" /> Corredores Activos ({racing?.length || 0})
          </h3>
          <div className="space-y-3">
            {racing?.map(r => (
              <div key={r.id} className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold">{r.profiles.first_name} {r.profiles.last_name}</p>
                  <p className="text-sm font-mono text-blue-700">{r.participant_code}</p>
                </div>
                <form action={simulateFinish}>
                  <input type="hidden" name="regId" value={r.id} />
                  <input type="hidden" name="eventId" value={id} />
                  <Button size="sm"><Flag className="mr-2 h-4 w-4"/> Cruzar Meta</Button>
                </form>
              </div>
            ))}
            {(!racing || racing.length === 0) && <p className="text-slate-500 text-sm">No hay corredores en competencia.</p>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold border-b pb-2 mb-4 flex items-center">
            <Flag className="mr-2 h-5 w-5 text-slate-600" /> En Meta - Pendientes de Cierre ({finished?.length || 0})
          </h3>
          <div className="bg-amber-50 p-3 rounded mb-4 text-xs text-amber-800 border border-amber-200">
            Revisa físicamente al corredor y verifica que no tenga incidentes antes de marcarlo como SEGURO.
          </div>
          <div className="space-y-3">
            {finished?.map(r => (
              <div key={r.id} className="bg-white border border-amber-200 rounded-lg p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold">{r.profiles.first_name} {r.profiles.last_name}</p>
                  <p className="text-sm font-mono text-blue-700">{r.participant_code}</p>
                </div>
                <form action={markSafe}>
                  <input type="hidden" name="regId" value={r.id} />
                  <input type="hidden" name="eventId" value={id} />
                  <Button size="sm" className="bg-green-600 hover:bg-green-700"><ShieldCheck className="mr-2 h-4 w-4"/> Cierre Seguro</Button>
                </form>
              </div>
            ))}
            {(!finished || finished.length === 0) && <p className="text-slate-500 text-sm">No hay corredores esperando cierre.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

import { Activity } from "lucide-react"
