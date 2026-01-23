import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/payments/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: payment, error } = await supabase
        .from('payments')
        .select('*, bookings (*)')
        .eq('id', id)
        .single();

    if (error) {
       if (error.code === 'PGRST116') return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
       throw error;
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}
