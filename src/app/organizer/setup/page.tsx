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

const orgSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
})

export default function OrganizerSetupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof orgSchema>>({
    resolver: zodResolver(orgSchema),
  })

  const onSubmit = async (data: z.infer<typeof orgSchema>) => {
    setLoading(true)
    setError(null)
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return;

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000)

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug,
        created_by: userData.user.id
      })
      .select()
      .single()

    if (orgError) {
      setError(orgError.message)
      setLoading(false)
      return
    }

    if (orgData) {
      // Agregar como miembro OWNER
      await supabase.from('organization_members').insert({
        organization_id: orgData.id,
        user_id: userData.user.id,
        role: 'OWNER'
      })

      router.push("/organizer/events")
      router.refresh()
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-2">Crear Organización</h2>
        <p className="text-slate-600 text-sm mb-6">Para empezar a crear eventos, necesitas configurar tu organización.</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la Organización</Label>
            <Input id="name" {...register("name")} placeholder="Ej. Running Club Perú" />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear Organización"}
          </Button>
        </form>
      </div>
    </div>
  )
}
