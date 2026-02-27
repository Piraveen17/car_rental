import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public registration endpoint.
// SECURITY: always creates a CUSTOMER. Admin/Staff must be promoted via controlled tooling.
export async function POST(request: Request) {
  try {
    const { email, password, name, phone } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'customer',
      },
    })

    if (error) {
      console.error('Supabase Create User Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Ensure public.users profile row exists / is synced.
    if (data?.user?.id) {
      await supabaseAdmin.from('users').upsert({
        id: data.user.id,
        email,
        name,
        phone: phone ?? null,
        role: 'customer',
      })
    }

    return NextResponse.json({ user: data.user })
  } catch (err: any) {
    console.error('Registration Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
