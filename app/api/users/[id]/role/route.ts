import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const callerRole = user.user_metadata?.role || 'customer';
    if (callerRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { role } = await req.json();
    if (!['admin', 'staff', 'customer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { id } = await params;

    // Update public.users
    const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', id)
        .select()
        .single();

    if (error) {
         if (error.code === 'PGRST116') return NextResponse.json({ error: 'User not found' }, { status: 404 });
         throw error;
    }

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
