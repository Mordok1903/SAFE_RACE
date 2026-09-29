"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Check if user is an organizer
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: orgMember } = await supabase.from('organization_members').select('id').eq('user_id', user.id).limit(1)
        if (orgMember && orgMember.length > 0) {
          router.push("/organizer/events")
        } else {
          router.push("/app/registrations")
        }
      } else {
        router.push("/app/registrations")
      }
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">SAFE RACE</h2>
          <p className="mt-2 text-sm text-slate-600">Inicia sesión en tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
          <div className="text-center text-sm text-slate-600">
            ¿No tienes cuenta? <Link href="/register" className="font-semibold text-blue-600 hover:underline">Regístrate</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
