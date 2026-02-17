import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/staff']
  const adminRoutes = ['/admin']
  const staffRoutes = ['/staff']
  
  const isProtectedRoute = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path))
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run Supabase middleware on static files and images
  const isStaticAsset = 
    request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/) ||
    request.nextUrl.pathname.startsWith('/_next')

  if (isStaticAsset) {
    return supabaseResponse
  }

  let user = null
  try {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()
    user = supabaseUser
  } catch (error) {
    console.error('Supabase getUser failed in middleware:', error)
    // Proceed as passing no user (logged out)
  }

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Basic RBAC check if user exists
  if (user) {
    // We defer RBAC to the main middleware.ts which checks the database role
    // reliable source of truth instead of potentially stale user_metadata
  }

  return supabaseResponse
}
