import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check ownership
    if (booking.user_id !== user.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Rules: start date not reached and status is pending or confirmed
    const now = new Date();
    // Assuming start_date is stored as ISO string or timestamp
    if (new Date(booking.start_date) <= now && booking.status !== 'pending') {
         return NextResponse.json({ error: 'Cannot cancel active or past booking' }, { status: 400 });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
        return NextResponse.json({ error: 'Booking already finalized' }, { status: 400 });
    }

    const body = await req.json();
    const { reason } = body;

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
            status: 'cancelled',
            cancelled_by: 'customer',
            cancel_reason: reason,
            cancelled_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (updateError) throw updateError;

    // Notify Staff/Admin
    // Fetch all admins/staff
    const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'staff']); // Assuming schema has role in users table

    if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
            user_id: admin.id,
            message: `Booking ${id} cancelled by Customer`,
            type: 'booking_cancelled',
            metadata: { bookingId: id, reason },
            read: false
        }));
        
        await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
     console.error('Error cancelling booking:', error);
     return NextResponse.json({ error: 'Failed to cancel booking', details: error.message }, { status: 500 });
  }
}
