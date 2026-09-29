import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, QrCode, Play } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function RegistrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, events(name, starts_at, distance_meters, location_name)')
    .eq('participant_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Mis Inscripciones</h1>
      <p className="text-slate-500 mb-8">Gestiona tus participaciones en competencias.</p>

      {!registrations || registrations.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <p className="text-slate-600 mb-4">No tienes ninguna inscripción activa.</p>
          <Link href="/">
            <Button>Explorar Carreras</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {registrations.map((reg) => (
            <div key={reg.id} className="bg-white rounded-xl border p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900">{reg.events?.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  reg.registration_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  reg.registration_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {reg.registration_status}
                </span>
              </div>
              
              <div className="text-sm text-slate-600 mb-6 space-y-1">
                <p><Calendar className="inline h-4 w-4 mr-2" /> {reg.events?.starts_at ? formatDate(reg.events.starts_at) : 'TBD'}</p>
                <p>Estado en carrera: <strong>{reg.race_status}</strong></p>
                {reg.participant_code && <p>Código Corredor: <strong>{reg.participant_code}</strong></p>}
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Link href={`/app/registrations/${reg.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">Detalles</Button>
                </Link>
                
                {reg.registration_status === 'APPROVED' && (
                  <Link href={`/app/registrations/${reg.id}/qr`} className="flex-1">
                    <Button variant="secondary" className="w-full"><QrCode className="mr-2 h-4 w-4"/> QR</Button>
                  </Link>
                )}

                {(reg.race_status === 'STARTED' || reg.race_status === 'RACING') && (
                  <Link href={`/app/registrations/${reg.id}/race`} className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white"><Play className="mr-2 h-4 w-4"/> CARRERA</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
