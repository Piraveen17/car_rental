import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';

// GET /api/payments/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;

    const { data: elevated } = await supabase.rpc('is_role', { roles: ['admin', 'staff'] });

    let q = supabase
      .from('payments')
      .select('*, bookings (*)')
      .eq('id', id);

    // Prevent IDOR: customers can only read their own payment.
    if (!elevated) q = q.eq('user_id', auth.user.id);

    const { data: payment, error } = await q.single();

    if (error) {
       if (error.code === 'PGRST116') return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
       throw error;
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}
