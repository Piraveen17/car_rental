import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/payments/complete
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { paymentId } = await request.json();

    // 1. Mark payment as completed
    const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentId)
        .select()
        .single();

    if (paymentError || !payment) {
      if (paymentError?.code === 'PGRST116' || !payment) {
          return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      throw paymentError;
    }

    // 2. Update booking status
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .update({ 
            payment_status: 'paid',
            status: 'confirmed' 
        })
        .eq('id', payment.booking_id)
        .select()
        .single();

    if (bookingError) {
         // Log critical error: Payment succeeded but booking update failed
         console.error('CRITICAL: Payment completed but booking update failed', bookingError);
         return NextResponse.json({ error: 'Booking missing or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error completing payment:", error);
    return NextResponse.json({ error: error.message || 'Payment completion failed' }, { status: 500 });
  }
}
