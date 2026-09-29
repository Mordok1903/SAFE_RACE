// script para entorno local Node
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log("Iniciando Seed para Demo...")
  
  // Create users directly using admin auth
  // NOTA: Para supabase local u hosteado, crear usuarios bypasses confirm
  
  const user1 = { email: 'organizador@saferace.test', password: 'password123', first_name: 'Admin', last_name: 'Organizador' }
  const user2 = { email: 'corredor1@saferace.test', password: 'password123', first_name: 'Juan', last_name: 'Perez' }
  const user3 = { email: 'corredor2@saferace.test', password: 'password123', first_name: 'Maria', last_name: 'Gomez' }
  
  const users = [user1, user2, user3]
  const createdUsers = []

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    })
    
    if (error) {
      console.log(`Usuario ${u.email} ya existe o error:`, error.message)
      // fetch id
      const { data: existing } = await supabase.from('profiles').select('id').eq('first_name', u.first_name).single()
      if (existing) createdUsers.push({ ...u, id: existing.id })
    } else if (data.user) {
      console.log(`Usuario ${u.email} creado.`)
      // insert profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        first_name: u.first_name,
        last_name: u.last_name,
        document_number: Math.floor(Math.random() * 100000000).toString()
      })
      createdUsers.push({ ...u, id: data.user.id })
    }
  }

  const orgId = createdUsers[0].id

  // Create Organization
  const { data: org } = await supabase.from('organizations').insert({
    name: 'SAFE RACE Demo Org',
    slug: 'safe-race-demo',
    created_by: orgId
  }).select('id').single()

  if (org) {
    console.log("Organización creada")
    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: orgId,
      role: 'OWNER'
    })

    // Create Event
    const { data: event } = await supabase.from('events').insert({
      organization_id: org.id,
      created_by: orgId,
      name: 'Maratón Demo 10K',
      public_slug: 'maraton-demo',
      distance_meters: 10000,
      starts_at: new Date().toISOString(),
      status: 'PUBLISHED'
    }).select('id').single()

    if (event) {
      console.log("Evento creado. URL: /race/maraton-demo")
      // Registrations
      if (createdUsers[1]) {
        await supabase.from('registrations').insert({
          event_id: event.id,
          participant_id: createdUsers[1].id,
          registration_status: 'PENDING'
        })
      }
      
      if (createdUsers[2]) {
        const { data: reg2 } = await supabase.from('registrations').insert({
          event_id: event.id,
          participant_id: createdUsers[2].id,
          registration_status: 'APPROVED',
          race_status: 'NOT_STARTED',
          participant_code: 'P999'
        }).select('id').single()

        if (reg2) {
          await supabase.from('qr_credentials').insert({ registration_id: reg2.id })
        }
      }
      console.log("Registros creados")
    }
  }
  
  console.log("Seed completado.")
}

seed().catch(console.error)
