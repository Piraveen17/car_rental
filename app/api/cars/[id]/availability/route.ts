import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch car constraints
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('min_days, max_days')
      .eq('car_id', id)
      .single();

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    // 2. Fetch active bookings (confirmed, pending payment)
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('car_id', id)
      .in('status', ['confirmed', 'pending']);

    if (bookingError) throw bookingError;

    // 3. Fetch unavailable ranges (maintenance, etc.)
    const { data: unavailable, error: unavailableError } = await supabase
      .from('car_unavailable')
      .select('start_date, end_date, reason')
      .eq('car_id', id);

    if (unavailableError) throw unavailableError;

    // Combine blocked dates
    // Simplify structure for frontend: array of { from: Date, to: Date, type: 'booking'|'maintenance' }
    const blockedDates = [
      ...(bookings || []).map(b => ({
        from: b.start_date,
        to: b.end_date,
        type: 'booking'
      })),
      ...(unavailable || []).map(u => ({
        from: u.start_date,
        to: u.end_date,
        type: 'maintenance',
        reason: u.reason
      }))
    ];

    return NextResponse.json({
      carId: id,
      minDays: car.min_days ?? 1,
      maxDays: car.max_days ?? 30,
      blockedDates
    });

  } catch (error: any) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
