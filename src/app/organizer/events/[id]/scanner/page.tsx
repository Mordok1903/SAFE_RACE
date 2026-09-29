"use client"
import { useEffect, useState, useRef, use } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckCircle, QrCode, Play } from "lucide-react"

export default function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [participant, setParticipant] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const supabase = createClient()

  const scanResultRef = useRef<string | null>(null)

  useEffect(() => {
    let isScanning = false
    let html5QrCode: Html5Qrcode | null = null;
    let timeout: NodeJS.Timeout;

    timeout = setTimeout(() => {
      html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScanSuccess(decodedText)
        },
        (error) => {
          // ignore
        }
      ).then(() => {
        isScanning = true
      }).catch((err) => {
        console.error("Camera start error:", err)
      })
    }, 150)

    return () => {
      clearTimeout(timeout)
      if (html5QrCode && isScanning) {
        html5QrCode.stop().catch(console.error)
      }
    }
  }, [])

  const onScanSuccess = async (decodedText: string) => {
    if (scanResultRef.current === decodedText) return; // Prevent duplicate immediate scans
    scanResultRef.current = decodedText;
    setScanResult(decodedText)
    
    // Pause scanner if possible or just handle logic
    setLoading(true)
    setMessage(null)
    
    // 1. Validar Credencial
    const { data: cred } = await supabase.from('qr_credentials').select('registration_id, is_active').eq('qr_token', decodedText).single()
    
    if (!cred || !cred.is_active) {
      setMessage({ type: 'error', text: 'Credencial inválida o inactiva.' })
      setLoading(false)
      setTimeout(() => setScanResult(null), 3000)
      return
    }

    // 2. Obtener registration
    const { data: reg } = await supabase.from('registrations')
      .select('*, profiles!registrations_participant_id_fkey(first_name, last_name)')
      .eq('id', cred.registration_id)
      .eq('event_id', id)
      .single()

    if (!reg) {
      setMessage({ type: 'error', text: 'El participante pertenece a otro evento.' })
      setLoading(false)
      setTimeout(() => setScanResult(null), 3000)
      return
    }

    setParticipant(reg)
    setLoading(false)
  }

  const onScanFailure = (error: any) => {
    // ignore
  }

  const handleAction = async (action: 'CHECK_IN' | 'START') => {
    if (!participant) return;
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()

    let newStatus = participant.race_status
    if (action === 'CHECK_IN') {
      newStatus = 'REGISTERED'
      await supabase.from('registrations').update({ race_status: newStatus, check_in_at: new Date().toISOString() }).eq('id', participant.id)
    } else if (action === 'START') {
      newStatus = 'STARTED'
      await supabase.from('registrations').update({ race_status: newStatus, start_at: new Date().toISOString() }).eq('id', participant.id)
      // También podríamos pasar a RACING inmediatamente
      await supabase.from('registrations').update({ race_status: 'RACING' }).eq('id', participant.id)
      newStatus = 'RACING'
    }

    // Registrar scan
    await supabase.from('qr_scans').insert({
      registration_id: participant.id,
      event_id: id,
      scan_type: action,
      scanned_by: user?.id,
      result: 'SUCCESS'
    })

    setMessage({ type: 'success', text: `Acción ${action} completada con éxito.` })
    setParticipant(null)
    setScanResult(null)
    setLoading(false)
  }

  const resetScan = () => {
    scanResultRef.current = null
    setScanResult(null)
    setParticipant(null)
    setMessage(null)
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Escáner QR</h2>

      <div className="bg-white p-4 rounded-xl shadow-md border mb-6">
        <div id="qr-reader" className="w-full"></div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-center font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {loading && <p className="text-center text-slate-500">Procesando...</p>}

      {participant && !loading && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center">
          <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <h3 className="text-xl font-bold">{participant.profiles.first_name} {participant.profiles.last_name}</h3>
          <p className="text-blue-800 font-mono text-lg mb-2">{participant.participant_code}</p>
          <p className="text-sm text-slate-600 mb-6">Estado actual: <strong>{participant.race_status}</strong></p>

          <div className="space-y-3">
            {participant.race_status === 'NOT_STARTED' && (
              <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => handleAction('CHECK_IN')}>
                <CheckCircle className="mr-2 h-5 w-5" /> Registrar Check-in
              </Button>
            )}
            
            {participant.race_status === 'REGISTERED' && (
              <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" onClick={() => handleAction('START')}>
                <Play className="mr-2 h-5 w-5" /> Registrar Partida
              </Button>
            )}

            {(participant.race_status === 'STARTED' || participant.race_status === 'RACING') && (
              <p className="text-green-700 font-medium">El corredor ya está en competencia.</p>
            )}

            <Button variant="outline" className="w-full" onClick={resetScan}>Cancelar / Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  )
}
