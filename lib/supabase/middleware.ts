import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase auth session cookie.
 * Uses getSession() (local cache only) instead of getUser() (network call)
 * to avoid unnecessary 403 errors on public pages when no session exists.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Skip static assets
  if (
    request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|woff|woff2|ttf|eot)$/) ||
    request.nextUrl.pathname.startsWith('/_next')
  ) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getSession() for cookie refresh — no network call, no 403 on public pages.
  // The main middleware.ts uses getUser() only for admin/staff routes where it matters.
  const protectedRoutes = ['/dashboard', '/admin', '/staff']
  const isProtected = protectedRoutes.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected) {
    // Only validate session on protected routes
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  } else {
    // On public routes: just refresh cookies without a network call
    await supabase.auth.getSession()
  }

  return supabaseResponse
}
