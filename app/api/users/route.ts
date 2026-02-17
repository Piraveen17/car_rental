import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const authz = await requireRole(supabase, ['admin']);
    if (!authz.ok) return authz.errorResponse;

    const url = new URL(req.url);
    const sp = url.searchParams;

    const page = Math.max(1, Number(sp.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(5, Number(sp.get('page_size') || sp.get('limit') || '10')));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const q = (sp.get('q') || '').trim().toLowerCase();
    const role = (sp.get('role') || '').trim();
    const sort = sp.get('sort') || 'created_at';
    const order = (sp.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order(sort, { ascending: order === 'asc' })
      .range(from, to);

    if (role) query = query.eq('role', role);
    if (q) {
      query = query.or(
        [
          `name.ilike.%${q}%`,
          `email.ilike.%${q}%`,
          `phone.ilike.%${q}%`,
          `id.ilike.%${q}%`,
        ].join(',')
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const mappedUsers = (data || []).map((u: any) => ({
      _id: u.id,
      userId: u.id,
      email: u.email,
      name: u.name || '',
      role: u.role || 'customer',
      phone: u.phone,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      isActive: u.is_active ?? true,
      lastSignInAt: u.last_sign_in_at,
      customerType: u.customer_type,
      isBanned: u.is_banned,
      isBlocked: u.is_blocked,
    }));

    return NextResponse.json({
      items: mappedUsers,
      meta: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
        sort,
        order,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
