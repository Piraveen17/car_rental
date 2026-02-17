import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';

// GET /api/customers (Admin only)
// Returns customers with computed booking stats (count + total spent for paid bookings).
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
    const sort = sp.get('sort') || 'created_at';
    const order = (sp.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', 'customer')
      .order(sort, { ascending: order === 'asc' })
      .range(from, to);

    if (q) {
      query = query.or(
        [`name.ilike.%${q}%`, `email.ilike.%${q}%`, `phone.ilike.%${q}%`, `id.ilike.%${q}%`].join(',')
      );
    }

    const { data: users, error: usersErr, count } = await query;
    if (usersErr) throw usersErr;

    const userIds = (users || []).map((u: any) => u.id);

    // Fetch all bookings for users in the current page (single query)
    let bookings: any[] = [];
    if (userIds.length) {
      const { data, error } = await supabase
        .from('bookings')
        .select('user_id,total_amount,payment_status')
        .in('user_id', userIds);
      if (error) throw error;
      bookings = data || [];
    }

    const statsByUser: Record<string, { totalBookings: number; totalSpent: number }> = {};
    for (const uid of userIds) statsByUser[uid] = { totalBookings: 0, totalSpent: 0 };

    for (const b of bookings) {
      const uid = b.user_id;
      if (!uid || !statsByUser[uid]) continue;
      statsByUser[uid].totalBookings += 1;
      if ((b.payment_status || '').toLowerCase() === 'paid') {
        statsByUser[uid].totalSpent += Number(b.total_amount || 0);
      }
    }

    const items = (users || []).map((u: any) => {
      const s = statsByUser[u.id] || { totalBookings: 0, totalSpent: 0 };
      return {
        userId: u.id,
        name: u.name || '',
        email: u.email,
        phone: u.phone,
        createdAt: u.created_at,
        isActive: u.is_active ?? true,
        totalBookings: s.totalBookings,
        totalSpent: s.totalSpent,
      };
    });

    return NextResponse.json({
      items,
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
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
