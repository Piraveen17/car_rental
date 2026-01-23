import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // 1. Update Session (Standard Supabase Middleware)
  // This handles the cookie refresh
  let response = await updateSession(request);
  
  // NOTE: updateSession returns a response, but we might want to branch logic *after* checking user.
  // However, `updateSession` in most Supabase examples just returns the response with cookies set.
  // To implement route protection *inside* middleware specifically for Next.js, 
  // we often need to re-instantiate the client or manually check cookies if we want to redirect *before* rendering.
  
  // Simpler approach for Middleware Role Check:
  // We can create a client here just to check user/role if the path is protected.
  
  if (request.nextUrl.pathname.startsWith('/admin')) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              // This acts as a read-only client for the logic below, 
              // the actual cookie set happens in the returned response via updateSession usually, 
              // but here we just need to read auth state.
            },
            remove(name: string, options: CookieOptions) {
            },
          },
        }
      )

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
          const url = request.nextUrl.clone()
          url.pathname = '/login'
          return NextResponse.redirect(url)
      }

      // Check Role
      const role = user.user_metadata?.role 
      // If we don't have role in metadata, we might need to fetch from DB, 
      // but blocking middleware with DB calls can be slow. 
      // Recommendation: Ensure Login/Register puts role in metadata.
      
      if (role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard' // or /403
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
