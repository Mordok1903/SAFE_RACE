import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { revalidatePath } from "next/cache"
import { generateRandomCode, formatDate } from "@/lib/utils"

export default async function EventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('*, profiles!registrations_participant_id_fkey(first_name, last_name, document_number)')
    .eq('event_id', id)
    .order('requested_at', { ascending: false })

  const pending = registrations?.filter(r => r.registration_status === 'PENDING') || []
  const approved = registrations?.filter(r => r.registration_status === 'APPROVED') || []
  const rejected = registrations?.filter(r => r.registration_status === 'REJECTED') || []

  async function approveRegistration(formData: FormData) {
    "use server"
    const regId = formData.get("regId") as string
    const eventId = formData.get("eventId") as string
    
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    
    // Generate code
    const code = "P" + generateRandomCode(4)
    
    await supabaseServer.from('registrations').update({
      registration_status: 'APPROVED',
      participant_code: code,
      approved_at: new Date().toISOString(),
      approved_by: user?.id
    }).eq('id', regId)

    // Generar credencial QR
    await supabaseServer.from('qr_credentials').insert({
      registration_id: regId
    })

    revalidatePath(`/organizer/events/${eventId}/registrations`)
  }

  async function rejectRegistration(formData: FormData) {
    "use server"
    const regId = formData.get("regId") as string
    const eventId = formData.get("eventId") as string
    
    const supabaseServer = await createClient()
    await supabaseServer.from('registrations').update({
      registration_status: 'REJECTED',
    }).eq('id', regId)

    revalidatePath(`/organizer/events/${eventId}/registrations`)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-900">Gestión de Solicitudes</h2>

      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-amber-700">Pendientes ({pending.length})</h3>
          {pending.length === 0 ? <p className="text-slate-500 text-sm">No hay solicitudes pendientes.</p> : (
            <div className="grid gap-4 md:grid-cols-2">
              {pending.map(reg => (
                <div key={reg.id} className="bg-white border rounded-lg p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{reg.profiles?.first_name} {reg.profiles?.last_name}</p>
                    <p className="text-sm text-slate-500">DNI: {reg.profiles?.document_number}</p>
                    <p className="text-xs text-slate-400">{formatDate(reg.requested_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={approveRegistration}>
                      <input type="hidden" name="regId" value={reg.id} />
                      <input type="hidden" name="eventId" value={id} />
                      <Button size="sm" className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4 mr-1"/> Aprobar</Button>
                    </form>
                    <form action={rejectRegistration}>
                      <input type="hidden" name="regId" value={reg.id} />
                      <input type="hidden" name="eventId" value={id} />
                      <Button size="sm" variant="destructive"><XCircle className="h-4 w-4 mr-1"/> Rechazar</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-green-700">Aprobados ({approved.length})</h3>
          {approved.length === 0 ? <p className="text-slate-500 text-sm">No hay participantes aprobados.</p> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approved.map(reg => (
                <div key={reg.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between">
                     <p className="font-bold text-slate-900">{reg.profiles?.first_name} {reg.profiles?.last_name}</p>
                     <span className="font-mono text-blue-700 font-bold">{reg.participant_code}</span>
                  </div>
                  <p className="text-sm text-slate-500">Estado en carrera: {reg.race_status}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
