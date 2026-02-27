import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !dbUser) {
      if (error?.code === 'PGRST116') {
         return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      user: dbUser
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
