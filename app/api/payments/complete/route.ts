import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/guards';
import { notifyRoles, notifyUser } from '@/lib/notifications';

// POST /api/payments/complete
// Marks a payment as completed and sets booking.payment_status = 'paid'.
// IMPORTANT (business rule): this does NOT confirm the booking.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json().catch(() => ({}));
    const paymentId = body?.paymentId;
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Read payment (service-role) then enforce ownership.
    const { data: payment, error: pErr } = await admin
      .from('payments')
      .select('id,user_id,booking_id,status,amount')
      .eq('id', paymentId)
      .single();

    if (pErr || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.user_id !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (payment.status !== 'completed') {
      const { error: updPayErr } = await admin
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', payment.id);
      if (updPayErr) throw updPayErr;
    }

    // Mark booking as paid (do NOT confirm here).
    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .update({ payment_status: 'paid' })
      .eq('id', payment.booking_id)
      .select('id,user_id,car_id,status')
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: 'Booking missing or update failed' }, { status: 404 });
    }

    // Notify (non-blocking)
    void (async () => {
      try {
        await notifyUser({
          userId: auth.user.id,
          type: 'payment',
          title: 'Payment recorded',
          body: 'Payment marked as PAID. A staff member will confirm your booking if required.',
          href: '/dashboard',
        });

        await notifyRoles({
          roles: ['admin', 'staff'],
          type: 'payment',
          title: 'Payment received',
          body: `Payment received for booking ${booking.id}.`,
          href: '/admin/bookings',
        });
      } catch (e) {
        console.warn('Notification failed (payment complete):', e);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error completing payment:', error);
    return NextResponse.json({ error: error?.message || 'Payment completion failed' }, { status: 500 });
  }
}
