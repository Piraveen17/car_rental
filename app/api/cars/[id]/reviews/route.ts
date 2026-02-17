import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch approved reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, users(name, id)')
      .eq('car_id', id)
      .eq('is_approved', true) // Only approved reviews
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate stats
    // Note: Ideally stats should be materialized or cached if scale is large, 
    // but for now on-the-fly calculation is fine.
    const count = reviews.length;
    const average = count > 0 
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / count 
        : 0;

    return NextResponse.json({
      reviews,
      stats: {
        count,
        average: parseFloat(average.toFixed(1))
      }
    });

  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
