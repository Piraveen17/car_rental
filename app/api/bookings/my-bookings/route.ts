import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/bookings/my-bookings
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, cars (make, model, images)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return NextResponse.json(bookings);
  } catch (error) {
     console.error('Error fetching my-bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
