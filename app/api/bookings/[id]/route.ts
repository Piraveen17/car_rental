import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { toDateOnly } from '@/lib/dates/toDateOnly';

const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed']).optional(),
  bookingStatus: z.enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  carId: z.string().optional(),
  totalAmount: z.number().optional(),
  total_amount: z.number().optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'other']).optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'card', 'other']).optional(),
  paidAt: z.string().optional(),
  paid_at: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(request, { params })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Only admins should be able to hard delete bookings
    const authz = await requireRole(supabase, ['admin']);
    if (!authz.ok) return authz.errorResponse;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
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

    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }
    const safeBody = parsed.data;

    // Sanitize and map payload to DB schema
    // Client sends camelCase (bookingId, userId, carId...) and relations (car, user).
    // DB needs snake_case and no relations.
    const updates: any = {};
    if (safeBody.status) updates.status = safeBody.status;
    if (safeBody.bookingStatus) updates.status = safeBody.bookingStatus;
    if (safeBody.paymentStatus !== undefined) updates.payment_status = safeBody.paymentStatus;
    
    // Optional editable fields
    if (safeBody.startDate) updates.start_date = safeBody.startDate;
    if (safeBody.endDate) updates.end_date = safeBody.endDate;
    if (safeBody.carId) updates.car_id = safeBody.carId;
    if (safeBody.totalAmount !== undefined) updates.total_amount = safeBody.totalAmount;
    if (safeBody.total_amount !== undefined) updates.total_amount = safeBody.total_amount;
    
    // Payment fields
    if (safeBody.payment_status) updates.payment_status = safeBody.payment_status;
    if (safeBody.paymentMethod) updates.payment_method = safeBody.paymentMethod;
    if (safeBody.payment_method) updates.payment_method = safeBody.payment_method;
    if (safeBody.paidAt) updates.paid_at = safeBody.paidAt;
    if (safeBody.paid_at) updates.paid_at = safeBody.paid_at;

    // Normalize status casing
    if (updates.status) updates.status = String(updates.status).toLowerCase();
    if (updates.payment_status) updates.payment_status = String(updates.payment_status).toLowerCase();

    // Auto-set paid_at if payment_status is paid and paid_at is not provided
    if (updates.payment_status === 'paid' && !updates.paid_at && (before as any).payment_status !== 'paid') {
      updates.paid_at = new Date().toISOString();
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
        .lt('start_date', toDateOnly(end))
        .gt('end_date', toDateOnly(start))
        .maybeSingle();

      if (conflict) {
        return NextResponse.json({ error: 'Car not available for selected dates' }, { status: 409 });
      }

      const { data: maintenanceConflict } = await admin
        .from('car_unavailable')
        .select('id')
        .eq('car_id', carId)
        .lt('start_date', toDateOnly(end))
        .gt('end_date', toDateOnly(start))
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
          message: finalBody,
          href: `/dashboard`,
          read: false,
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
