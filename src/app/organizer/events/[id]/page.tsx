import { createClient } from "@/lib/supabase/server"
import { Users, Activity, Flag, AlertTriangle, ShieldCheck } from "lucide-react"

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // Get counts
  const { count: pendingCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('registration_status', 'PENDING')
  const { count: approvedCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('registration_status', 'APPROVED')
  const { count: racingCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('race_status', 'RACING')
  const { count: safeCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('race_status', 'SAFE')
  const { count: alertsCount } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('event_id', id).in('status', ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'])
  
  const { data: event } = await supabase.from('events').select('status, public_slug').eq('id', id).single()

  const stats = [
    { name: "Solicitudes Pendientes", value: pendingCount || 0, icon: Users, color: "text-amber-600", bg: "bg-amber-100" },
    { name: "Aprobados (QR Listos)", value: approvedCount || 0, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "En Competencia", value: racingCount || 0, icon: Activity, color: "text-green-600", bg: "bg-green-100" },
    { name: "Alertas Activas", value: alertsCount || 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { name: "Cerrados (SAFE)", value: safeCount || 0, icon: Flag, color: "text-slate-600", bg: "bg-slate-100" },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard del Evento</h2>
        {event?.status === 'DRAFT' && (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border">
            BORRADOR
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
            <p className="text-xs text-slate-500 uppercase font-medium tracking-wide">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900">
        <h3 className="font-bold mb-2">Link Público de Inscripción</h3>
        <p className="text-sm mb-2">Comparte este enlace con los participantes para que puedan inscribirse a la carrera:</p>
        <div className="flex items-center gap-2">
          <code className="bg-white px-3 py-2 rounded border border-blue-300 font-mono text-sm w-full md:w-auto">
            {process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/race/{event?.public_slug}
          </code>
        </div>
      </div>
    </div>
  )
}
