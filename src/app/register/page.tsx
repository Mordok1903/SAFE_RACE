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

const registerSchema = z.object({
  first_name: z.string().min(2, "Mínimo 2 caracteres"),
  last_name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  document_number: z.string().min(5, "Documento inválido"),
  emergency_contact_name: z.string().min(2, "Nombre de contacto requerido"),
  emergency_contact_phone: z.string().min(6, "Teléfono de contacto requerido"),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError(null)
    
    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // 2. Insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          document_number: data.document_number,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone
        })

      if (profileError) {
        console.error("Profile error:", profileError)
        // Aún así el usuario se creó, pero profile falló.
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push("/app/registrations")
        router.refresh()
      }, 2000)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow-md text-center">
          <h2 className="text-2xl font-bold text-green-600">Registro exitoso</h2>
          <p className="text-slate-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-8 shadow-md my-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Registro</h2>
          <p className="mt-2 text-sm text-slate-600">Únete a SAFE RACE</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nombres</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="last_name">Apellidos</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document_number">DNI / Documento</Label>
              <Input id="document_number" {...register("document_number")} />
              {errors.document_number && <p className="mt-1 text-sm text-red-600">{errors.document_number.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-slate-800 mb-4">Contacto de Emergencia</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact_name">Nombre</Label>
                <Input id="emergency_contact_name" {...register("emergency_contact_name")} />
                {errors.emergency_contact_name && <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="emergency_contact_phone">Teléfono</Label>
                <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} />
                {errors.emergency_contact_phone && <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_phone.message}</p>}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando..." : "Registrarme"}
          </Button>
          <div className="text-center text-sm text-slate-600">
            ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-blue-600 hover:underline">Inicia Sesión</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
