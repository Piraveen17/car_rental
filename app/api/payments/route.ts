import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/payments
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
         booking_id: body.bookingId,
         amount: body.amount,
         status: 'pending',
         method: body.method,
         user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
