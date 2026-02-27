import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { notifyRoles } from '@/lib/notifications';
import { bookingFromDb } from '@/lib/mappers';
import { isProfileComplete } from '@/lib/profile/isProfileComplete';
import { toDateOnly } from '@/lib/dates/toDateOnly';

// ─── GET: List Bookings ────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(req.url);
    const sp = url.searchParams;

    const page = Math.max(1, Number(sp.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(5, Number(sp.get('page_size') || '10')));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const q = (sp.get('q') || '').trim();
    const status = sp.get('status') || '';
    const carId = sp.get('car_id') || sp.get('carId') || '';
    const userId = sp.get('user_id') || sp.get('userId') || '';
    const dateFrom = sp.get('date_from');
    const dateTo = sp.get('date_to');
    const sort = sp.get('sort') || 'created_at';
    const order = (sp.get('order') || 'desc') === 'asc' ? 'asc' : 'desc';

    const staffCheck = await requireRole(supabase, ['admin', 'staff']);
    const isAdminOrStaff = staffCheck.ok;

    let query = supabase
      .from('bookings')
      .select('*, cars (*), users!bookings_user_id_fkey (id, email, name, role)', { count: 'exact' })
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
    if (q) {
      const esc = q.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(`id.ilike.%${esc}%,cars.make.ilike.%${esc}%,cars.model.ilike.%${esc}%,users!bookings_user_id_fkey.name.ilike.%${esc}%,users!bookings_user_id_fkey.email.ilike.%${esc}%`);
    }

    const { data: bookings, error, count } = await query;
    if (error) throw error;

    // Auto-complete past confirmed bookings
    const now = new Date();
    const toComplete = (bookings || []).filter(
      (b: any) => b.status === 'confirmed' && new Date(b.end_date) < now
    );
    if (toComplete.length > 0) {
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .in('id', toComplete.map((b: any) => b.id));
      toComplete.forEach((b: any) => { b.status = 'completed'; });
    }

    return NextResponse.json({
      items: (bookings || []).map(bookingFromDb),
      meta: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
        sort,
        order,
      },
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// ─── POST: Create Booking ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { carId, startDate, endDate, addons } = body;

    if (!carId || !startDate || !endDate) {
      return NextResponse.json({ error: 'carId, startDate, endDate are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });

    // 0. Check profile completeness
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('name, phone, nic_passport')
      .eq('id', user.id)
      .single();

    if (userError || !userProfile || !isProfileComplete(userProfile)) {
      return NextResponse.json({ error: 'Profile incomplete. Please complete your profile before booking.' }, { status: 422 });
    }

    // 1. Fetch car (support both schema column name versions)
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('*')
      .eq('car_id', carId)
      .eq('status', 'active')
      .single();

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found or not available' }, { status: 404 });
    }

    const minDays = car.min_rental_days ?? car.min_days ?? 1;
    const maxDays = car.max_rental_days ?? car.max_days ?? 90;

    if (days < minDays) {
      return NextResponse.json({ error: `Minimum rental is ${minDays} day(s)` }, { status: 400 });
    }
    if (days > maxDays) {
      return NextResponse.json({ error: `Maximum rental is ${maxDays} days` }, { status: 400 });
    }

    // 2. Overlap check — use service role if available, else anon client
    //    (anon can't see other users' bookings due to RLS, but confirmed overlap check 
    //     still works if we only check this user's confirmed bookings + the DB trigger catches the rest)
    let adminClient = supabase;
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      adminClient = createAdminClient() as any;
    } catch {
      // SUPABASE_SERVICE_ROLE_KEY not set - use anon client as fallback
      // The DB trigger will reject overlaps server-side
    }

    const { data: conflict } = await (adminClient as any)
      .from('bookings')
      .select('id')
      .eq('car_id', carId)
      .eq('status', 'confirmed')
      .lt('start_date', toDateOnly(end))
      .gt('end_date', toDateOnly(start))
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: 'Car not available for the selected dates' }, { status: 409 });
    }

    // 3. Check car_unavailable (maintenance blocks) — optional table
    try {
      const { data: unavailConflict } = await (adminClient as any)
        .from('car_unavailable')
        .select('id')
        .eq('car_id', carId)
        .lt('start_date', toDateOnly(end))
        .gt('end_date', toDateOnly(start))
        .maybeSingle();

      if (unavailConflict) {
        return NextResponse.json({ error: 'Car is blocked for the selected dates' }, { status: 409 });
      }
    } catch {
      // Table doesn't exist yet — skip
    }

    // 4. Calculate amounts
    const pricePerDay = Number(car.price_per_day);
    const baseAmount = days * pricePerDay;

    let addonsAmount = 0;
    const addonsPayload: Record<string, any> = {};

    if (addons) {
      const PRICES = {
        driver: 50, extraKm: 20, delivery: 30,
        childSeat: 10, gpsNavigation: 8,
        insurance_basic: 15, insurance_full: 30
      };

      if (addons.driver) { addonsAmount += PRICES.driver * days; addonsPayload.driver = true; }
      if (Number(addons.extraKmQty) > 0) {
        addonsAmount += Number(addons.extraKmQty) * PRICES.extraKm;
        addonsPayload.extraKmQty = Number(addons.extraKmQty);
      }
      if (addons.delivery) { addonsAmount += PRICES.delivery; addonsPayload.delivery = true; }
      if (addons.childSeat) { addonsAmount += PRICES.childSeat * days; addonsPayload.childSeat = true; }
      if (addons.gpsNavigation) { addonsAmount += PRICES.gpsNavigation * days; addonsPayload.gpsNavigation = true; }
      if (addons.insurance) {
        const insPrice = addons.insuranceType === 'full' ? PRICES.insurance_full : PRICES.insurance_basic;
        addonsAmount += insPrice * days;
        addonsPayload.insurance = true;
        addonsPayload.insuranceType = addons.insuranceType ?? 'basic';
      }
    }

    const totalAmount = baseAmount + addonsAmount;

    // 5. Create booking
    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        car_id: carId,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        base_amount: baseAmount,
        addons_amount: addonsAmount,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending',
        booking_source: 'online',
        addons: Object.keys(addonsPayload).length ? addonsPayload : null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Booking insert error:', createError);
      // DB trigger overlap rejection
      if (createError.message?.includes('BOOKING_OVERLAP') || createError.message?.includes('CAR_UNAVAILABLE')) {
        return NextResponse.json({ error: 'Car not available for the selected dates' }, { status: 409 });
      }
      throw createError;
    }

    // 6. Notify staff (best-effort)
    void notifyRoles({
      roles: ['admin', 'staff'],
      type: 'booking_created',
      title: 'New booking awaiting confirmation',
      body: `Booking ${booking.id} needs approval.`,
      href: `/admin/bookings?status=pending`,
    });

    return NextResponse.json(bookingFromDb(booking), { status: 201 });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
