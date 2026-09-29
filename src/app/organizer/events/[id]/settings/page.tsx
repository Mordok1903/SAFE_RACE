import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

  async function updateRules(formData: FormData) {
    "use server"
    const supabaseServer = await createClient()
    
    await supabaseServer.from('events').update({ 
      route_tolerance_meters: Number(formData.get('route_tolerance_meters')),
      deviation_time_seconds: Number(formData.get('deviation_time_seconds')),
      stationary_time_seconds: Number(formData.get('stationary_time_seconds')),
      no_gps_time_seconds: Number(formData.get('no_gps_time_seconds')),
    }).eq('id', id)
    
    revalidatePath(`/organizer/events/${id}/settings`)
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <h2 className="text-2xl font-bold mb-6">Configuración del Evento</h2>
      
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-8">
        {/* ESTADO */}
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

        {/* REGLAS MOTOR ALERTAS */}
        <div>
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">Reglas del Motor de Alertas (MVP)</h3>
          
          <form action={updateRules} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="route_tolerance_meters">Tolerancia de desvío de ruta (metros)</Label>
                <Input 
                  id="route_tolerance_meters" 
                  name="route_tolerance_meters" 
                  type="number" 
                  defaultValue={event?.route_tolerance_meters} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviation_time_seconds">Tiempo para confirmar desvío (segs)</Label>
                <Input 
                  id="deviation_time_seconds" 
                  name="deviation_time_seconds" 
                  type="number" 
                  defaultValue={event?.deviation_time_seconds} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stationary_time_seconds">Alerta estacionario (segs sin moverse)</Label>
                <Input 
                  id="stationary_time_seconds" 
                  name="stationary_time_seconds" 
                  type="number" 
                  defaultValue={event?.stationary_time_seconds} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_gps_time_seconds">Alerta pérdida de GPS (segs)</Label>
                <Input 
                  id="no_gps_time_seconds" 
                  name="no_gps_time_seconds" 
                  type="number" 
                  defaultValue={event?.no_gps_time_seconds} 
                  required 
                />
              </div>
            </div>
            
            <div className="pt-2">
              <Button type="submit" variant="outline" className="w-full">
                Guardar Reglas de Alerta
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
