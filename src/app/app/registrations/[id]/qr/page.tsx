"use client"
import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function QRCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadQR() {
      // Intentar obtener el token actual
      const { data } = await supabase.from('qr_credentials').select('qr_token').eq('registration_id', id).eq('is_active', true).single()
      
      if (data) {
        setToken(data.qr_token)
      } else {
        // Si no existe, generarlo
        const { data: newCred, error } = await supabase.from('qr_credentials').insert({
          registration_id: id,
        }).select('qr_token').single()
        
        if (newCred) setToken(newCred.qr_token)
      }
      setLoading(false)
    }
    loadQR()
  }, [id, supabase])

  if (loading) return <div className="p-8 text-center">Cargando credencial...</div>
  if (!token) return <div className="p-8 text-center text-red-600">Error al obtener credencial.</div>

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-sm">
        <Link href={`/app/registrations/${id}`} className="text-blue-600 flex items-center text-sm hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Link>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg border text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Credencial Oficial</h2>
          <p className="text-slate-500 text-sm mb-8">Muestra este código al organizador para el check-in y la partida.</p>
          
          <div className="bg-white p-4 rounded-xl shadow-inner border inline-block">
            <QRCodeSVG value={token} size={256} level="H" />
          </div>
          
          <p className="mt-8 text-xs text-slate-400">El código no contiene información personal y es seguro compartirlo con la organización.</p>
        </div>
      </div>
    </div>
  )
}
