import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, QrCode, Map, Activity, Flag, Settings } from "lucide-react"

export default async function EventLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()

  if (!event) {
    redirect("/organizer/events")
  }

  const menu = [
    { name: "Dashboard", href: `/organizer/events/${id}`, icon: LayoutDashboard },
    { name: "Solicitudes", href: `/organizer/events/${id}/registrations`, icon: Users },
    { name: "Escáner QR", href: `/organizer/events/${id}/scanner`, icon: QrCode },
    { name: "Ruta GPS", href: `/organizer/events/${id}/route`, icon: Map },
    { name: "Mapa en Vivo", href: `/organizer/events/${id}/live`, icon: Activity },
    { name: "Simulador Meta", href: `/organizer/events/${id}/finish`, icon: Flag },
    { name: "Configuración", href: `/organizer/events/${id}/settings`, icon: Settings },
  ]

  return (
    <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full w-full">
      <aside className="w-full md:w-64 bg-white border-r flex flex-col hidden md:flex min-h-[calc(100vh-64px)]">
        <div className="p-4 border-b">
          <h2 className="font-bold text-slate-800 line-clamp-1">{event.name}</h2>
          <span className="text-xs text-slate-500">ID: {event.id.split('-')[0]}</span>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {menu.map((item) => (
            <Link key={item.name} href={item.href} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-700">
              <item.icon className="mr-3 h-5 w-5 opacity-75" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile menu */}
      <div className="md:hidden bg-white border-b flex overflow-x-auto p-2">
         {menu.map((item) => (
            <Link key={item.name} href={item.href} className="flex flex-col items-center p-2 min-w-[80px] text-xs text-slate-700 hover:text-blue-700">
              <item.icon className="h-5 w-5 mb-1 opacity-75" />
              <span className="truncate w-full text-center">{item.name}</span>
            </Link>
          ))}
      </div>

      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
