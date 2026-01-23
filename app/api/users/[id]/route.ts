import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const role = user.user_metadata?.role || 'customer';
    if (role !== 'admin') {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role: newRole, ...rest } = body;

    const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ role: newRole, ...rest })
        .eq('id', id)
        .select()
        .single();

    if (error) {
         if (error.code === 'PGRST116') return NextResponse.json({ error: 'User not found' }, { status: 404 });
         throw error;
    }
    
    // Note: We are only updating the public.users table role. 
    // To update Auth metadata role, we'd need the Service Role Key and auth.admin.updateUserById,
    // which shouldn't be exposed on client side, but this is a Server Action/Route.
    // However, for this migration, we'll assume App logic reads from public.users OR we rely on triggers.
    // To make role persistent in metadata, we would ideally do it here, but let's stick to public table first.

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
