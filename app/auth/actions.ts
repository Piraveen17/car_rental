'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Could not authenticate user')
  }

  // Role-based redirect (single source of truth: public.users.role)
  const { data: u } = await supabase.auth.getUser()
  const userId = u?.user?.id
  let role = 'customer'
  if (userId) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    role = profile?.role || 'customer'
  }

  revalidatePath('/', 'layout')

  if (role === 'admin') redirect('/admin')
  if (role === 'staff') redirect('/staff')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  // SECURITY: self-signup can only create customers.
  const role = 'customer'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  })

  if (error) {
    redirect('/signup?error=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to continue sign in process')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
