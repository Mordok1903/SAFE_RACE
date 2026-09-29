import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { QrCode, Play, ArrowLeft } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function RegistrationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reg } = await supabase
    .from('registrations')
    .select('*, events(*)')
    .eq('id', id)
    .eq('participant_id', user!.id)
    .single()

  if (!reg) notFound()

  return (
    <div>
      <Link href="/app/registrations" className="text-blue-600 flex items-center text-sm hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
      </Link>
      
      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className="bg-slate-900 p-6 text-white">
          <p className="text-blue-400 text-sm font-semibold uppercase mb-1">Inscripción</p>
          <h1 className="text-2xl font-bold">{reg.events?.name}</h1>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-800 border-b pb-2 mb-4">Estado</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Inscripción:</dt>
                  <dd className="font-medium">{reg.registration_status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Carrera:</dt>
                  <dd className="font-medium">{reg.race_status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Código:</dt>
                  <dd className="font-bold text-blue-700">{reg.participant_code || '-'}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-800 border-b pb-2 mb-4">Evento</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Inicio:</dt>
                  <dd className="font-medium">{reg.events?.starts_at ? formatDate(reg.events.starts_at) : '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Distancia:</dt>
                  <dd className="font-medium">{reg.events?.distance_meters ? `${reg.events.distance_meters/1000} km` : '-'}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            {reg.registration_status === 'APPROVED' && (
              <Link href={`/app/registrations/${reg.id}/qr`} className="flex-1">
                <Button className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700">
                  <QrCode className="mr-2 h-5 w-5" /> Mostrar Credencial QR
                </Button>
              </Link>
            )}
            
            {(reg.race_status === 'STARTED' || reg.race_status === 'RACING') && (
              <Link href={`/app/registrations/${reg.id}/race`} className="flex-1">
                <Button className="w-full text-lg h-12 bg-green-600 hover:bg-green-700">
                  <Play className="mr-2 h-5 w-5" /> Entrar a Carrera
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
