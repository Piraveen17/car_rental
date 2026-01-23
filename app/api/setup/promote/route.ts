import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login first.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'admin';

    if (!['admin', 'staff', 'customer'].includes(role)) {
         return NextResponse.json({ error: 'Invalid role. Use admin, staff, or customer.' }, { status: 400 });
    }

    // Update public.users table
    const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ role: role })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
         if (error.code === 'PGRST116') return NextResponse.json({ error: 'User not found in Supabase public table.' }, { status: 404 });
         throw error;
    }

    // Note: This only updates the role in the public table.
    // Syncing to Auth metadata requires service role key or triggers.
    
    return NextResponse.json({ 
        success: true, 
        message: `Successfully promoted to ${role}`, 
        user: updatedUser 
    });

  } catch (error) {
    console.error('Error promoting user:', error);
    return NextResponse.json({ error: 'Failed to promote user' }, { status: 500 });
  }
}
