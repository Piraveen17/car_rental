import { createClient } from '@/lib/supabase/server'

export type Role = 'admin' | 'staff' | 'customer'

/**
 * @deprecated Use `requireRole` from `@/lib/auth/guards` for API routes,
 * or `getUserAndRole` in middleware. This helper is kept for backward compat
 * but always reads role from the DB (single source of truth).
 */
export async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Always read from DB — metadata can be stale after role changes
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    return (profile?.role as Role) || 'customer'
  } catch {
    // Fallback to metadata only if DB unreachable
    return (user.user_metadata?.role as Role) || 'customer'
  }
}

export async function requireRole(allowedRoles: Role[]) {
  const role = await getCurrentUserRole()
  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Unauthorized')
  }
  return role
}

