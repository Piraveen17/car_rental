import { createClient } from '@/lib/supabase/server'

export type Role = 'admin' | 'staff' | 'customer'

export async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // In this simple migration, we trust the metadata.
  // Ideally we would fetch from a 'users' table if we had triggers syncing auth to public.users
  const role = user.user_metadata?.role
  
  return (role as Role) || 'customer'
}

export async function requireRole(allowedRoles: Role[]) {
  const role = await getCurrentUserRole()
  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Unauthorized')
  }
  return role
}
