import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(request, { params })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const authz = await requireRole(supabase, ['admin', 'staff']);
    if (!authz.ok) return authz.errorResponse;

    // Fetch current booking to detect state transitions for notifications
    const { data: before, error: beforeErr } = await supabase
      .from('bookings')
      .select('id,status,payment_status,user_id,car_id,start_date,end_date')
      .eq('id', id)
      .single();
    if (beforeErr) {
      if ((beforeErr as any).code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      throw beforeErr;
    }

    const body = await request.json();

    // Sanitize and map payload to DB schema
    // Client sends camelCase (bookingId, userId, carId...) and relations (car, user).
    // DB needs snake_case and no relations.
    const updates: any = {};
    if (body.status) updates.status = body.status;
    if (body.bookingStatus) updates.status = body.bookingStatus;
    if (body.paymentStatus !== undefined) updates.payment_status = body.paymentStatus;
    // Map other fields as needed

    // Optional editable fields
    if (body.startDate) updates.start_date = body.startDate;
    if (body.endDate) updates.end_date = body.endDate;
    if (body.carId) updates.car_id = body.carId;
    
    // If body has direct snake_case keys (sometimes client sends them), keep them
    if (body.payment_status) updates.payment_status = body.payment_status;

    // Normalize status casing
    if (updates.status) updates.status = String(updates.status).toLowerCase();
    if (updates.payment_status) updates.payment_status = String(updates.payment_status).toLowerCase();

    // Validate status
    if (updates.status) {
      const allowed = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
      if (!allowed.includes(updates.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    // Prevent empty updates
    if (Object.keys(updates).length === 0) {
         return NextResponse.json({ message: "No valid fields to update" });
    }

    // If confirming, ensure no overlap with existing CONFIRMED bookings and no maintenance block.
    if (updates.status === 'confirmed') {
      const admin = createAdminClient();
      const carId = updates.car_id ?? (before as any).car_id;
      const start = updates.start_date ?? (before as any).start_date;
      const end = updates.end_date ?? (before as any).end_date;

      const { data: conflict } = await admin
        .from('bookings')
        .select('id')
        .eq('car_id', carId)
        .eq('status', 'confirmed')
        .neq('id', id)
        .lt('start_date', new Date(end).toISOString())
        .gt('end_date', new Date(start).toISOString())
        .maybeSingle();

      if (conflict) {
        return NextResponse.json({ error: 'Car not available for selected dates' }, { status: 409 });
      }

      const { data: maintenanceConflict } = await admin
        .from('car_unavailable')
        .select('id')
        .eq('car_id', carId)
        .lt('start_date', new Date(end).toISOString())
        .gt('end_date', new Date(start).toISOString())
        .maybeSingle();

      if (maintenanceConflict) {
        return NextResponse.json({ error: 'Car is under maintenance for selected dates' }, { status: 409 });
      }
    }

    const { data: updatedBooking, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        // Exclusion constraint violation (if DB overlap constraint is installed)
        if ((error as any).code === '23P01') {
            return NextResponse.json({ error: 'Car not available for selected dates' }, { status: 409 });
        }
        if (error.code === 'PGRST116') { // No rows returned/found
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        throw error;
    }

    const afterStatus = String((updatedBooking as any).status || '').toLowerCase();
    const beforeStatus = String((before as any).status || '').toLowerCase();
    const afterPay = String((updatedBooking as any).payment_status || '').toLowerCase();
    const beforePay = String((before as any).payment_status || '').toLowerCase();

    // Notification helper (non-blocking)
    const notifyCustomer = async (title: string, body: string) => {
      try {
        const admin = createAdminClient();

        const userId = (updatedBooking as any).user_id ?? (before as any).user_id;
        const carId = (updatedBooking as any).car_id ?? (before as any).car_id;

        // Optional: enrich with car info
        const { data: car } = await admin
          .from('cars')
          .select('make,model')
          .eq('car_id', carId)
          .maybeSingle();

        const carLabel = car?.make && car?.model ? `${car.make} ${car.model}` : 'your car';
        const finalBody = body.replace('{car}', carLabel);

        await admin.from('notifications').insert({
          user_id: userId,
          type: 'booking',
          title,
          body: finalBody,
          href: `/dashboard/bookings`,
          is_read: false,
        });
      } catch (e) {
        console.warn('Notification insert failed (booking update):', e);
      }
    };

    // Trigger: booking confirmed -> notify customer (transition only)
    if (beforeStatus !== 'confirmed' && afterStatus === 'confirmed') {
      await notifyCustomer('Booking confirmed', 'Your booking for {car} has been confirmed.');
    }

    // Trigger: booking rejected -> notify customer (transition only)
    if (beforeStatus !== 'rejected' && afterStatus === 'rejected') {
      await notifyCustomer('Booking rejected', 'Your booking for {car} was rejected. Please try different dates or another car.');
    }

    // Trigger: booking cancelled by admin/staff -> notify customer (transition only)
    if (beforeStatus !== 'cancelled' && afterStatus === 'cancelled') {
      await notifyCustomer('Booking cancelled', 'Your booking for {car} was cancelled by our team. Please contact support if needed.');
    }

    // Trigger: payment status updated to paid -> notify customer (transition only)
    if (beforePay !== 'paid' && afterPay === 'paid') {
      await notifyCustomer('Payment received', 'Payment received for {car}. Thank you!');
    }

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
