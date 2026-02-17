import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { notifyRoles } from '@/lib/notifications';

// GET: My Bookings (Customer) or All Bookings (Admin/Staff)
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(req.url);
    const sp = url.searchParams;

    // pagination
    const page = Math.max(1, Number(sp.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(5, Number(sp.get('page_size') || sp.get('limit') || '10')));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const q = (sp.get('q') || '').trim().toLowerCase();
    const status = (sp.get('status') || '').trim();
    const carId = (sp.get('car_id') || sp.get('carId') || '').trim();
    const userId = (sp.get('user_id') || sp.get('userId') || '').trim();
    const dateFrom = sp.get('date_from');
    const dateTo = sp.get('date_to');
    const sort = sp.get('sort') || 'created_at';
    const order = (sp.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Authz: customers can only view own bookings. Admin/staff can view all.
    const staff = await requireRole(supabase, ['admin', 'staff']);
    const isAdminOrStaff = staff.ok;

    let query = supabase
      .from('bookings')
      .select('*, cars (*), users (email, name, role)', { count: 'exact' })
      .order(sort, { ascending: order === 'asc' })
      .range(from, to);

    if (!isAdminOrStaff) {
      query = query.eq('user_id', auth.user.id);
    } else {
      if (userId) query = query.eq('user_id', userId);
    }

    if (carId) query = query.eq('car_id', carId);
    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('start_date', dateFrom);
    if (dateTo) query = query.lte('end_date', dateTo);

    // Basic search: booking id, car make/model, customer name/email
    if (q) {
      // Search on joined tables is limited; use OR on top-level + joined textual columns
      // (Supabase supports OR with foreign table columns if selected)
      query = query.or(
        [
          `id.ilike.%${q}%`,
          `cars.make.ilike.%${q}%`,
          `cars.model.ilike.%${q}%`,
          `users.name.ilike.%${q}%`,
          `users.email.ilike.%${q}%`,
        ].join(',')
      );
    }

    const { data: bookings, error, count } = await query;

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

    return NextResponse.json({
      items: bookings || [],
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

    // Use service-role for cross-tenant availability checks (RLS would hide other users' bookings)
    const admin = createAdminClient();

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
    // Business rule: PENDING bookings must NOT block availability.
    // Only CONFIRMED bookings block the same car for overlapping dates.
    // Overlap: existing.start < requested.end AND existing.end > requested.start
    const { data: conflict } = await admin
      .from('bookings')
      .select('id')
      .eq('car_id', carId)
      .eq('status', 'confirmed')
      .lt('start_date', end.toISOString())
      .gt('end_date', start.toISOString())
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: 'Car not available for selected dates' }, { status: 400 });
    }

    // Check maintenance blocks as well (blocks regardless of booking status)
    const { data: maintenanceConflict } = await admin
      .from('car_unavailable')
      .select('id')
      .eq('car_id', carId)
      .lt('start_date', end.toISOString())
      .gt('end_date', start.toISOString())
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
    
    // Best-effort: notify admin/staff of new pending booking
    void notifyRoles({
      roles: ['admin', 'staff'],
      type: 'booking_pending',
      title: 'New booking awaiting confirmation',
      body: `Booking ${booking.id} is pending approval.`,
      href: `/admin/bookings?status=pending&q=${booking.id}`,
    });

    return NextResponse.json(booking, { status: 201 });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 500 });
  }
}
