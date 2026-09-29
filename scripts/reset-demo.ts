import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

// Load environment variables
loadEnvConfig(process.cwd())

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function resetRace() {
  console.log("🧹 Iniciando limpieza de la carrera para una nueva demo...")
  
  // 1. Borrar posiciones GPS
  console.log("- Borrando posiciones GPS históricas...")
  const { error: errGps } = await supabase.from('gps_positions').delete().neq('id', 0)
  if (errGps) console.error("Error borrando GPS:", errGps.message)

  // 2. Borrar alertas
  console.log("- Borrando alertas previas...")
  const { error: errAlerts } = await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (errAlerts) console.error("Error borrando Alertas:", errAlerts.message)

  // 3. Reiniciar estado de corredores
  console.log("- Reiniciando el estado de todos los corredores a 'NOT_STARTED'...")
  const { error: errReg } = await supabase.from('registrations')
    .update({ race_status: 'NOT_STARTED' })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (errReg) console.error("Error reiniciando corredores:", errReg.message)

  // 4. Asegurarse que el evento siga ACTIVO o pasarlo a PUBLISHED si se desea re-escanear
  // Lo dejaremos en PUBLISHED para que puedas hacer la prueba completa desde el Escáner QR
  console.log("- Volviendo el evento al estado 'PUBLISHED' (listo para escanear QR)...")
  const { error: errEvent } = await supabase.from('events')
    .update({ status: 'PUBLISHED' })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (errEvent) console.error("Error reiniciando evento:", errEvent.message)

  console.log("✅ ¡Limpieza completada! Ya puedes abrir tu app y hacer la demo desde cero.")
}

resetRace().catch(console.error)
