import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/guards';

// PATCH /api/users/[id] (Admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const gate = await requireRole(supabase, ['admin']);
    if (!gate.ok) return gate.errorResponse;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const { role: newRole, ...rest } = body;

    if (newRole && !['admin', 'staff', 'customer'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Update public.users
    const { data: updatedUser, error } = await admin
      .from('users')
      .update({ ...(newRole ? { role: newRole } : {}), ...rest })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return NextResponse.json({ error: 'User not found' }, { status: 404 });
      throw error;
    }

    // Keep auth metadata in sync when role changes.
    if (newRole) {
      const { error: authError } = await admin.auth.admin.updateUserById(id, {
        user_metadata: { role: newRole },
      });
      if (authError) console.error('Failed to sync role to auth metadata', authError);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
