import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { carId, bookingId, rating, comment } = await req.json();

    if (!carId || !bookingId || !rating) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Server-side validation: Check eligibility
    // 1. Booking belongs to user
    // 2. Booking is completed
    // 3. Booking matches car
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, car_id, end_date')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .single();

    if (bookingError || !booking) {
        return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });
    }

    if (booking.car_id !== carId) {
        return NextResponse.json({ error: 'Booking mismatch' }, { status: 400 });
    }

    if (booking.status !== 'completed') {
        // Allow reviewing 'paid' bookings? Prompt said "completed". Use 'completed'.
        // If the system doesn't auto-complete bookings, user might be stuck. 
        // For strictness we use 'completed'.
        // However, if the user manually marks complete or admin does, then OK.
        // Let's assume 'completed' status exists and is used.
        // If not, maybe 'confirmed' + end_date passed? 
        // Let's stick to status check first.
        const now = new Date();
        const endDate = new Date(booking.end_date); // Need to fetch end_date if we use time logic
        // But let's check status as per prompt "booking.status == 'completed'".
        if (booking.status !== 'completed') {
             return NextResponse.json({ error: 'Booking must be completed to review' }, { status: 400 });
        }
    }

    // Check availability of duplicate review handled by DB unique constraint, 
    // but good to check gracefully? 
    // We'll let DB constraint throw error or catch it.

    const { data: review, error: insertError } = await supabase
        .from('reviews')
        .insert({
            car_id: carId,
            user_id: user.id,
            booking_id: bookingId,
            rating,
            comment,
        })
        .select()
        .single();

    if (insertError) {
        if (insertError.code === '23505') { // Unique violation
            return NextResponse.json({ error: 'Review already exists for this booking' }, { status: 409 });
        }
        throw insertError;
    }

    return NextResponse.json(review, { status: 201 });

  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
