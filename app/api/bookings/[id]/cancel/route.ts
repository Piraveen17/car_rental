import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/guards';
import { notifyRoles, notifyUser } from '@/lib/notifications';

// Customer cancel (policy-based)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason ?? null;

    const admin = createAdminClient();

    // Fetch booking using service role, then enforce ownership.
    const { data: booking, error: fetchError } = await admin
      .from('bookings')
      .select('id,user_id,status,start_date,end_date,car_id')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.user_id !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Policy: customer can cancel only before start_date and only if not finalized.
    const now = new Date();
    const start = new Date(booking.start_date);

    if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected') {
      return NextResponse.json({ error: 'Booking already finalized' }, { status: 400 });
    }

    if (start <= now) {
      return NextResponse.json({ error: 'Cannot cancel after start time' }, { status: 400 });
    }

    const { data: updatedBooking, error: updateError } = await admin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: 'customer',
        cancel_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    // Notify admin/staff + customer
    void (async () => {
      try {
        await notifyRoles({
          roles: ['admin', 'staff'],
          type: 'booking',
          title: 'Booking cancelled by customer',
          body: `Booking ${id} was cancelled by the customer.`,
          href: '/admin/bookings',
        });

        await notifyUser({
          userId: auth.user.id,
          type: 'booking',
          title: 'Booking cancelled',
          body: 'Your booking was cancelled successfully.',
          href: '/dashboard',
        });
      } catch (e) {
        console.warn('Cancellation notification failed:', e);
      }
    })();

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
