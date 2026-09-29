import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Target } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function PublicRacePage({ params }: { params: { publicSlug: string } }) {
  const supabase = await createClient()
  
  const { data: event } = await supabase
    .from('events')
    .select('*, organizations(name)')
    .eq('public_slug', params.publicSlug)
    .single()

  if (!event) {
    notFound()
  }

  // Check if logged in and if already registered
  const { data: { user } } = await supabase.auth.getUser()
  let existingRegistration = null;

  if (user) {
    const { data: reg } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', event.id)
      .eq('participant_id', user.id)
      .single()
    existingRegistration = reg;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-12 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-400 font-medium tracking-wider uppercase mb-4">{event.organizations?.name}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">{event.name}</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {event.description || "Competencia monitoreada con el sistema de seguridad SAFE RACE."}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 -mt-8">
        <div className="bg-white rounded-xl shadow-lg border p-6 md:p-8">
          
          <div className="grid sm:grid-cols-3 gap-6 mb-8 border-b pb-8">
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-bold text-slate-900">Fecha</h3>
              <p className="text-slate-600 text-sm">{event.starts_at ? formatDate(event.starts_at) : 'Por definir'}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <MapPin className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-bold text-slate-900">Ubicación</h3>
              <p className="text-slate-600 text-sm">{event.location_name || 'Por definir'}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Target className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-bold text-slate-900">Distancia</h3>
              <p className="text-slate-600 text-sm">{event.distance_meters ? `${(event.distance_meters/1000).toFixed(1)} km` : '-'}</p>
            </div>
          </div>

          <div className="text-center">
            {existingRegistration ? (
              <div className="bg-slate-100 p-6 rounded-xl inline-block w-full max-w-md">
                <p className="font-medium text-slate-800 mb-4">Ya estás inscrito en este evento.</p>
                <Link href={`/app/registrations/${existingRegistration.id}`}>
                  <Button className="w-full">Ver mi Inscripción</Button>
                </Link>
              </div>
            ) : !user ? (
              <div className="space-y-4">
                <p className="text-slate-600 mb-4">Debes iniciar sesión para inscribirte en la carrera.</p>
                <Link href={`/login?next=/race/${params.publicSlug}`}>
                  <Button size="lg" className="w-full sm:w-auto px-8">Iniciar Sesión para Inscribirse</Button>
                </Link>
              </div>
            ) : (
              <form action={async () => {
                "use server"
                const supabaseServer = await createClient()
                const { data: { user: currentUser } } = await supabaseServer.auth.getUser()
                if (currentUser) {
                  await supabaseServer.from('registrations').insert({
                    event_id: event.id,
                    participant_id: currentUser.id,
                    registration_status: 'PENDING'
                  })
                  redirect(`/app/registrations`)
                }
              }}>
                <Button type="submit" size="lg" className="w-full sm:w-auto px-12 text-lg">
                  Solicitar Inscripción
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  Al solicitar inscripción, permites a la organización acceder a tus datos y utilizar el sistema de monitoreo SAFE RACE durante el evento.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
