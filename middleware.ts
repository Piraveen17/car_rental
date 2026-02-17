import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// Helper function to get user and role from request
async function getUserAndRole(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { user: null, role: null }
  }

  // ALWAYS fetch role from database (single source of truth)
  // This ensures role changes in Supabase Dashboard take effect immediately
  let role: string | undefined;
  
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    role = profile?.role;
  } catch (error) {
    console.error('[Middleware] DB query failed:', error);
    // Fallback to metadata only if database query fails
    role = user.user_metadata?.role;
  }
  
  // Final fallback to 'customer' if still undefined
  return { user, role: role || 'customer' }
}

export async function middleware(request: NextRequest) {
  // 1. Update Session - This handles cookie refresh and must be done first
  const response = await updateSession(request);
  
  const { pathname } = request.nextUrl
  
  // 2. Protect /admin routes - admin only
  if (pathname.startsWith('/admin')) {
    const { user, role } = await getUserAndRole(request)

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    if (role !== 'admin') {
      const url = request.nextUrl.clone()
      // Redirect staff to their dashboard, others to customer dashboard
      url.pathname = role === 'staff' ? '/staff' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }
  
  // 3. Protect /staff routes - admin and staff only
  if (pathname.startsWith('/staff')) {
    const { user, role } = await getUserAndRole(request)
    
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    if (role !== 'admin' && role !== 'staff') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes might handle their own auth, or protect them here too)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
