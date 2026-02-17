import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/guards';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const authz = await requireRole(supabase, ['admin']);
    if (!authz.ok) return authz.errorResponse;
    
    const { role } = await req.json();
    if (!['admin', 'staff', 'customer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { id } = await params;

    const supabaseAdmin = createAdminClient();

    // Update public.users (service role)
    const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', id)
        .select()
        .single();

    if (error) {
         if (error.code === 'PGRST116') return NextResponse.json({ error: 'User not found' }, { status: 404 });
         throw error;
    }

    // Also update Auth user_metadata so middleware / role checks work immediately.
    // This requires service_role, so we use the admin client.
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { role }
    });

    if (authError) {
      console.error('Failed to sync role to auth metadata', authError);
      // Don't fail the whole request because public.users is already updated.
    }

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
