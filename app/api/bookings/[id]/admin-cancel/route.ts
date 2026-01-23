import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Role
    const role = user.user_metadata?.role || 'customer';
    if (role !== 'admin') {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const body = await req.json();
    const { adminNote } = body;

    if (!adminNote) {
        return NextResponse.json({ error: 'Admin note is required' }, { status: 400 });
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
            status: 'cancelled',
            cancelled_by: 'admin',
            cancel_reason: adminNote,
            cancelled_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
    
    if (updateError) throw updateError;

    // Notify Customer
    await supabase.from('notifications').insert({
        user_id: booking.user_id,
        message: `Your booking was cancelled by admin. Reason: ${adminNote}`,
        type: 'booking_cancelled',
        metadata: { bookingId: id, reason: adminNote },
        read: false
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
     console.error('Error admin cancelling booking:', error);
     return NextResponse.json({ error: 'Failed to cancel booking', details: error.message }, { status: 500 });
  }
}
