import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const role = user.user_metadata?.role || 'customer';
    if (role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Fetch users from Supabase Auth (Source of Truth)
    const adminClient = createAdminClient();
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Reasonable limit for now
    });

    if (error) throw error;

    // Map Auth Users to the shape expected by the frontend (similar to IUser)
    const mappedUsers = users.map(u => ({
      _id: u.id, // Frontend uses _id or userId
      userId: u.id,
      email: u.email,
      name: u.user_metadata?.name || '',
      role: u.user_metadata?.role || 'customer',
      phone: u.phone,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      isActive: u.email_confirmed_at ? true : false,
      lastSignInAt: u.last_sign_in_at
    }));

    return NextResponse.json(mappedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Unauthorized or failed to fetch users' }, { status: 401 });
  }
}
