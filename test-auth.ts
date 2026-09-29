import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Faltan variables de entorno")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'organizador@saferace.test',
    password: 'password123'
  })
  
  if (authError) {
    console.error("Auth error:", authError)
    return
  }
  
  const { data, error } = await supabase
    .from('registrations')
    .select('*, profiles(first_name, last_name, document_number)')
    
  console.log("Registrations:", data)
  console.log("Error:", error)
}
run()
