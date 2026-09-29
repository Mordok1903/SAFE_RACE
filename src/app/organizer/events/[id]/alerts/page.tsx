import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { revalidatePath } from "next/cache"
import { formatDate } from "@/lib/utils"

export default async function AlertsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, registrations(participant_code, profiles!registrations_participant_id_fkey(first_name, last_name, phone))')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  const activeAlerts = alerts?.filter(a => ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'].includes(a.status)) || []
  const resolvedAlerts = alerts?.filter(a => a.status === 'RESOLVED') || []

  async function acknowledgeAlert(formData: FormData) {
    "use server"
    const alertId = formData.get("alertId") as string
    const eventId = formData.get("eventId") as string
    
    const supabaseServer = await createClient()
    await supabaseServer.from('alerts').update({
      status: 'ACKNOWLEDGED',
      acknowledged_at: new Date().toISOString()
    }).eq('id', alertId)

    revalidatePath(`/organizer/events/${eventId}/alerts`)
  }

  async function resolveAlert(formData: FormData) {
    "use server"
    const alertId = formData.get("alertId") as string
    const eventId = formData.get("eventId") as string
    
    const supabaseServer = await createClient()
    await supabaseServer.from('alerts').update({
      status: 'RESOLVED',
      resolved_at: new Date().toISOString()
    }).eq('id', alertId)

    revalidatePath(`/organizer/events/${eventId}/alerts`)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <AlertTriangle className="mr-2 h-6 w-6 text-red-600" /> Centro de Alertas
      </h2>

      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-red-700">Alertas Activas ({activeAlerts.length})</h3>
          {activeAlerts.length === 0 ? <p className="text-slate-500 text-sm">No hay alertas activas en este momento.</p> : (
            <div className="grid gap-4">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-red-800 uppercase px-2 py-1 bg-red-100 rounded text-xs">
                        {alert.type}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        Estado: {alert.status}
                      </span>
                    </div>
                    <p className="font-bold text-lg">
                      {alert.registrations?.profiles?.first_name} {alert.registrations?.profiles?.last_name} 
                      <span className="text-blue-700 ml-2 text-sm font-mono">{alert.registrations?.participant_code}</span>
                    </p>
                    {alert.type === 'SOS' && <p className="text-red-700 font-medium my-1">Motivo: {alert.sos_reason}</p>}
                    <p className="text-sm text-slate-600">Teléfono: {alert.registrations?.profiles?.phone || 'No registrado'}</p>
                    <p className="text-xs text-slate-500 mt-2 flex items-center"><Clock className="h-3 w-3 mr-1"/> {formatDate(alert.created_at)}</p>
                    
                    {alert.latitude && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}`} target="_blank" className="text-blue-600 text-xs hover:underline mt-1 block">
                        Ver en Google Maps
                      </a>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 justify-center">
                    {alert.status === 'CREATED' && (
                      <form action={acknowledgeAlert}>
                        <input type="hidden" name="alertId" value={alert.id} />
                        <input type="hidden" name="eventId" value={id} />
                        <Button size="sm" className="w-full">Reconocer Alerta</Button>
                      </form>
                    )}
                    
                    <form action={resolveAlert}>
                      <input type="hidden" name="alertId" value={alert.id} />
                      <input type="hidden" name="eventId" value={id} />
                      <Button size="sm" variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50">
                        <CheckCircle className="h-4 w-4 mr-1"/> Marcar Resuelta
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-slate-700">Historial de Alertas Resueltas ({resolvedAlerts.length})</h3>
          <div className="space-y-2">
            {resolvedAlerts.map(alert => (
              <div key={alert.id} className="bg-white border rounded-lg p-3 text-sm flex justify-between items-center opacity-75">
                <div>
                  <span className="font-bold mr-2">{alert.type}</span>
                  <span>{alert.registrations?.participant_code} - {alert.registrations?.profiles?.first_name}</span>
                </div>
                <div className="text-slate-500 text-xs">
                  Resuelta el {alert.resolved_at ? formatDate(alert.resolved_at) : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
