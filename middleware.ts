import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Always refresh the session cookie first (required by @supabase/ssr)
  const response = await updateSession(request)

  const isAdminRoute = pathname.startsWith('/admin')
  const isStaffRoute = pathname.startsWith('/staff')

  // 2. Only do the heavy role check for admin/staff routes
  //    This prevents unnecessary getUser() calls (and 403 errors) on public pages
  if (isAdminRoute || isStaffRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )

    let user = null
    let role: string | null = null

    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      user = u
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        role = profile?.role ?? user.user_metadata?.role ?? 'customer'
      }
    } catch {
      // auth/db error — treat as unauthenticated
    }

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    if (isAdminRoute && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'staff' ? '/staff' : '/dashboard'
      return NextResponse.redirect(url)
    }

    if (isStaffRoute && role !== 'admin' && role !== 'staff') {
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
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)  
     * - favicon.ico
     * - public image/font files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
