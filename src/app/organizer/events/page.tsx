import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, PlusCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function EventsListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's organizations
  const { data: memberships } = await supabase.from('organization_members').select('organization_id').eq('user_id', user!.id)
  const orgIds = memberships?.map(m => m.organization_id) || []

  let events: any[] = []
  if (orgIds.length > 0) {
    const { data: evts } = await supabase.from('events').select('*').in('organization_id', orgIds).order('created_at', { ascending: false })
    events = evts || []
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Eventos</h1>
          <p className="text-slate-500">Gestiona tus competencias y carreras.</p>
        </div>
        <Link href="/organizer/events/new">
          <Button><PlusCircle className="mr-2 h-4 w-4"/> Nuevo Evento</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No hay eventos</h3>
          <p className="text-slate-500 mb-6">Aún no has creado ningún evento. Comienza ahora.</p>
          <Link href="/organizer/events/new">
            <Button>Crear Primer Evento</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link href={`/organizer/events/${event.id}`} key={event.id}>
              <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900 line-clamp-2">{event.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${
                    event.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' :
                    event.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {event.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {event.starts_at ? formatDate(event.starts_at) : 'Fecha sin definir'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location_name || 'Ubicación sin definir'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Users className="h-4 w-4 mr-2" />
                    Máx. {event.max_participants || '-'} part.
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between items-center text-sm">
                  <span className="text-blue-600 font-medium">Gestionar</span>
                  <span className="text-slate-400 text-xs">{(event.distance_meters / 1000).toFixed(1)} km</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
