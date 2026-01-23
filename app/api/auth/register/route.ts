import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    
    const supabaseAdmin = createAdminClient()

    // 1. Check if user already exists
    const { data: existingUser, error: findError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })
    
    // Note: listUsers is not the best way to check if a specific email exists efficiently without filters, 
    // but for "first user check" we need the total count or just to see if ANY user exists.
    // To check if *this* email exists, we could try to create and catch error, or list with filter if supported (not always robust in all versions).
    // However, clean Supabase logic:
    
    // Check global user count to determine role
    // We only need to know if count > 0.
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 })
    
    if (listError) {
        console.error("Error listing users:", listError)
        return NextResponse.json({ error: "Failed to check existing users" }, { status: 500 })
    }
    
    // If the valid users list is empty, this is the first user.
    // Note: This logic assumes 'usersList.users' is the array. 
    // Be aware that listUsers returns { users: User[], total: number } (total might be inaccurate/pagination dependent).
    
    const isFirstUser = usersList.users.length === 0
    const role = isFirstUser ? 'admin' : 'customer'

    // 2. Create User with Metadata
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role
      }
    })

    if (error) {
      console.error("Supabase Create User Error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data.user })

  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
