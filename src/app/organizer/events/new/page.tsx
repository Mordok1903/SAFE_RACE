"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const eventSchema = z.object({
  name: z.string().min(5, "Nombre muy corto"),
  location_name: z.string().min(3, "Requerido"),
  distance_meters: z.coerce.number().min(100),
  starts_at: z.string().min(1, "Fecha requerida"),
  organization_id: z.string().min(1, "Selecciona una organización")
})

type EventForm = z.infer<typeof eventSchema>

export default function NewEventPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [orgs, setOrgs] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
  })

  useEffect(() => {
    async function loadOrgs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return;
      const { data } = await supabase.from('organization_members')
        .select('organizations(id, name)')
        .eq('user_id', user.id)
      
      if (data && data.length > 0) {
        const organizations = data.map(d => d.organizations)
        setOrgs(organizations)
        const org = organizations[0] as any
        setValue("organization_id", org.id)
      }
    }
    loadOrgs()
  }, [supabase, setValue])

  const onSubmit = async (data: EventForm) => {
    setLoading(true)
    setError(null)
    
    const { data: userData } = await supabase.auth.getUser()
    const public_slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000)

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        organization_id: data.organization_id,
        created_by: userData.user?.id,
        name: data.name,
        public_slug,
        location_name: data.location_name,
        distance_meters: data.distance_meters,
        starts_at: new Date(data.starts_at).toISOString(),
        status: 'DRAFT'
      })
      .select()
      .single()

    if (eventError) {
      setError(eventError.message)
      setLoading(false)
      return
    }

    router.push(`/organizer/events/${eventData.id}`)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <Link href="/organizer/events" className="text-blue-600 flex items-center text-sm hover:underline mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a eventos
        </Link>
        <h1 className="text-3xl font-bold">Crear Nuevo Evento</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label>Organización</Label>
            <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" {...register("organization_id")}>
              {orgs.map((org: any) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            {errors.organization_id && <p className="text-sm text-red-600 mt-1">{errors.organization_id.message}</p>}
          </div>

          <div>
            <Label>Nombre del Evento</Label>
            <Input {...register("name")} placeholder="Ej. Maratón Lima 10K" />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ubicación</Label>
              <Input {...register("location_name")} placeholder="Ej. Parque Kennedy" />
              {errors.location_name && <p className="text-sm text-red-600 mt-1">{errors.location_name.message}</p>}
            </div>
            <div>
              <Label>Distancia (metros)</Label>
              <Input type="number" {...register("distance_meters")} placeholder="Ej. 10000" />
              {errors.distance_meters && <p className="text-sm text-red-600 mt-1">{errors.distance_meters.message}</p>}
            </div>
          </div>

          <div>
            <Label>Fecha y Hora de Inicio</Label>
            <Input type="datetime-local" {...register("starts_at")} />
            {errors.starts_at && <p className="text-sm text-red-600 mt-1">{errors.starts_at.message}</p>}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear Evento"}
          </Button>
        </form>
      </div>
    </div>
  )
}
