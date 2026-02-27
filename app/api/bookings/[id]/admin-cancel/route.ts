import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/guards';
import { notifyUser } from '@/lib/notifications';

// Admin/Staff cancel a booking
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const gate = await requireRole(supabase, ['admin', 'staff']);
    if (gate.errorResponse) return gate.errorResponse;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const note = body?.adminNote ?? body?.reason ?? null;

    if (!note || typeof note !== 'string') {
      return NextResponse.json({ error: 'Cancellation note is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: booking, error: fetchError } = await admin
      .from('bookings')
      .select('id,user_id,status')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking already finalized' }, { status: 400 });
    }

    const { data: updatedBooking, error: updateError } = await admin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: 'admin',
        cancel_reason: note,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    // Notify customer
    void (async () => {
      try {
        await notifyUser({
          userId: booking.user_id,
          type: 'booking',
          title: 'Booking cancelled',
          body: `Your booking was cancelled by staff/admin. Reason: ${note}`,
          href: '/dashboard',
        });
      } catch (e) {
        console.warn('Customer notification failed (admin cancel):', e);
      }
    })();

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error('Error admin cancelling booking:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
