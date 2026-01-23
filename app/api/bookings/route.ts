import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: My Bookings (Customer) or All Bookings (Admin/Staff)
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role || 'customer';
    
    let query = supabase
      .from('bookings')
      .select('*, cars (*), users (email, name, role)') // Join cars and users
      .order('created_at', { ascending: false });

    if (role === 'customer') {
      query = query.eq('user_id', user.id);
    }
    // Admin/Staff see all. Filter logic can be added via search params later.

    const { data: bookings, error } = await query;

    if (error) {
       console.error('Supabase error fetching bookings:', error);
       throw error;
    }

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST: Create Booking (Customer)
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { carId, startDate, endDate, totalAmount } = body;

    // Validate car availability
    const { data: conflict, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('car_id', carId)
      .in('status', ['confirmed', 'payment_pending']) // Check status overlap
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`) // Overlap logic
      .maybeSingle();

    if (conflictError && conflictError.code !== 'PGRST116') { // Ignore "no rows" error if using .single() but using maybeSingle is safer
        console.error("Conflict check error", conflictError);
    }

    if (conflict) {
      return NextResponse.json({ error: 'Car not available for selected dates' }, { status: 400 });
    }

    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        car_id: carId,
        start_date: startDate,
        end_date: endDate,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending',
        booking_source: 'online'
      })
      .select()
      .single();

    if (createError) {
        throw createError;
    }

    // Notify Admin/Staff (Optional: Trigger, or separate notification table insert here)
    // For now, let's keep it simple or implement notifications later if needed.
    // The previous implementation inserted into Notification model.
    // If we have a notifications table, we can validly insert there.
    
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
