import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Activity, User, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: orgMember } = await supabase.from('organization_members').select('id').eq('user_id', user.id).limit(1)
  const isOrganizer = orgMember && orgMember.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
        <Link href="/app/registrations" className="flex items-center gap-2 font-bold text-lg text-blue-700">
          <Activity className="h-5 w-5" />
          <span className="hidden sm:inline">SAFE RACE</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {isOrganizer && (
            <Link href="/organizer/events" className="text-sm font-medium text-blue-600 mr-2 hover:underline">
              Dashboard Organizador
            </Link>
          )}
          <div className="text-sm font-medium text-slate-700 mr-2">
            {profile?.first_name} {profile?.last_name}
          </div>
          <form action="/logout" method="post">
            <Button variant="ghost" size="sm" type="submit" className="text-slate-500">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </form>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
