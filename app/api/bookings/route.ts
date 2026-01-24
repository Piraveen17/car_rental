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

    const { data: isAdminOrStaff } = await supabase.rpc('is_role', { roles: ['admin', 'staff'] });
    
    let query = supabase
      .from('bookings')
      .select('*, cars (*), users (email, name, role)') // Join cars and users
      .order('created_at', { ascending: false });

    if (!isAdminOrStaff) {
      query = query.eq('user_id', user.id);
    }
    // Admin/Staff see all. Filter logic can be added via search params later.

    const { data: bookings, error } = await query;

    if (error) {
       console.error('Supabase error fetching bookings:', error);
       throw error;
    }

    // Auto-complete logic
    const now = new Date();
    const bookingsToComplete = bookings.filter((b: any) => 
        b.status === 'confirmed' && new Date(b.end_date) < now
    );

    if (bookingsToComplete.length > 0) {
        const ids = bookingsToComplete.map((b: any) => b.id);
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'completed' })
            .in('id', ids);
            
        if (updateError) console.error("Failed to auto-complete bookings", updateError);
        else {
            // Update local list to reflect changes
            bookingsToComplete.forEach((b: any) => b.status = 'completed');
        }
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
    const { carId, startDate, endDate, addons } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) {
        return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }

    // 1. Fetch Car details & Constraints
    const { data: car, error: carError } = await supabase
        .from('cars')
        .select('price_per_day, min_days, max_days')
        .eq('car_id', carId)
        .single();

    if (carError || !car) {
        return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    if (days < (car.min_days || 1)) {
        return NextResponse.json({ error: `Minimum rental is ${car.min_days} days` }, { status: 400 });
    }
    if (days > (car.max_days || 30)) {
        return NextResponse.json({ error: `Maximum rental is ${car.max_days} days` }, { status: 400 });
    }

    // 2. Validate availability (Overlap check)
    // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
    const { data: conflict, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('car_id', carId)
      .in('status', ['confirmed', 'pending']) // Check active bookings
      .or(`start_date.lte.${end.toISOString()},end_date.gte.${start.toISOString()}`) // Range overlap
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: 'Car not available for selected dates' }, { status: 400 });
    }

    // Check maintenance blocks as well
    const { data: maintenanceConflict } = await supabase
      .from('car_unavailable')
      .select('id')
      .eq('car_id', carId)
      .or(`start_date.lte.${end.toISOString()},end_date.gte.${start.toISOString()}`)
      .maybeSingle();

    if (maintenanceConflict) {
        return NextResponse.json({ error: 'Car is under maintenance for selected dates' }, { status: 400 });
    }

    // 3. Calculate Base Amount
    const baseAmount = days * Number(car.price_per_day);

    // 4. Calculate Addons Amount & Prepare items
    let addonsAmount = 0;
    const bookingAddonsPayload = [];

    if (addons) {
        // Fetch active addons from DB to get real prices
        const { data: dbAddons } = await supabase
            .from('addons')
            .select('*')
            .eq('is_active', true);

        if (dbAddons) {
            // Driver
            if (addons.driver) {
                const driverAddon = dbAddons.find(a => a.code === 'driver');
                if (driverAddon) {
                    const cost = days * Number(driverAddon.price);
                    addonsAmount += cost;
                    bookingAddonsPayload.push({
                        addon_id: driverAddon.id,
                        qty: days, // Driver is per day, so qty = days? Or logic says PricingType=per_day. Usually this means Price * Days.
                        // For the booking_addons table, qty usually implies distinct units.
                        // If pricing_type is 'per_day', total = price * qty (where qty is days).
                        // Let's assume qty = days for per_day items.
                        // Wait, prompts says: "Driver: per_day".
                        // "booking_addons(qty int...)"
                        // If I store qty=days, then unit_price=50, total=50*days. Correct.
                        unit_price: driverAddon.price,
                        total: cost
                    });
                }
            }
            
            // Extra KM
            if (addons.extraKmQty > 0) {
                const kmAddon = dbAddons.find(a => a.code === 'extra_km');
                if (kmAddon) {
                    const cost = addons.extraKmQty * Number(kmAddon.price);
                    addonsAmount += cost;
                    bookingAddonsPayload.push({
                        addon_id: kmAddon.id,
                        qty: addons.extraKmQty,
                        unit_price: kmAddon.price,
                        total: cost
                    });
                }
            }

            // Delivery
            if (addons.delivery) {
                const deliveryAddon = dbAddons.find(a => a.code === 'delivery');
                if (deliveryAddon) {
                    const cost = Number(deliveryAddon.price);
                    addonsAmount += cost;
                    bookingAddonsPayload.push({
                        addon_id: deliveryAddon.id,
                        qty: 1,
                        unit_price: deliveryAddon.price,
                        total: cost
                    });
                }
            }
        }
    }

    const totalAmount = baseAmount + addonsAmount;

    // 5. Insert Booking
    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        car_id: carId,
        start_date: startDate,
        end_date: endDate,
        base_amount: baseAmount,
        addons_amount: addonsAmount,
        total_amount: totalAmount,
        status: 'pending', // Changed to 'pending' to satisfy constraint
        payment_status: 'pending',
        booking_source: 'online'
      })
      .select()
      .single();

    if (createError) throw createError;

    // 6. Insert Booking Addons
    if (bookingAddonsPayload.length > 0) {
        const addonsToInsert = bookingAddonsPayload.map(item => ({
            booking_id: booking.id,
            ...item
        }));
        
        const { error: addonsError } = await supabase
            .from('booking_addons')
            .insert(addonsToInsert);
            
        if (addonsError) {
            console.error("Error inserting addons:", addonsError);
            // Non-fatal? Or should we rollback? 
            // Supabase doesn't support easy transactions via simple JS client without RPC.
            // We'll log it. Critical info is in 'addons_amount' column anyway.
        }
    }
    
    return NextResponse.json(booking, { status: 201 });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 500 });
  }
}
