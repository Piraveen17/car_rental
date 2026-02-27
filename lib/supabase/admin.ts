import { createClient } from '@supabase/supabase-js'

// Note: Accessing process.env.SUPABASE_SERVICE_ROLE_KEY directly 
// means this file should ONLY be imported in server-side contexts (API routes, Server Actions).
// NEVER import this in a client component.

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
