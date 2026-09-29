import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Activity, Shield, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user belongs to any organization, otherwise they need to create one.
  const { data: memberships } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id)
  
  const hasOrganization = memberships && memberships.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-slate-900 px-4 md:px-6 text-white">
        <Link href="/organizer" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="h-5 w-5 text-blue-400" />
          <span>ORGANIZADOR</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/organizer/events">Eventos</Link>
          <form action="/logout" method="post">
            <Button variant="ghost" size="sm" type="submit" className="text-slate-300 hover:text-white hover:bg-slate-800">
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </form>
        </nav>
      </header>
      
      {!hasOrganization && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-3 text-center text-sm">
          Aún no tienes una organización. Ve a <Link href="/organizer/setup" className="font-bold underline">Configuración</Link> para crearla.
        </div>
      )}

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
