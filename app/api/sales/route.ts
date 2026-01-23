import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('sale_cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: cars, error } = await query;
    if (error) throw error;

    return NextResponse.json(cars);
  } catch (error) {
    console.error("Error fetching sale cars:", error);
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role || 'customer';
    if (!['admin', 'staff'].includes(role)) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const { data: car, error } = await supabase
      .from('sale_cars')
      .insert({
          make: body.make,
          model: body.model,
          year: body.year,
          price: body.price,
          mileage: body.mileage,
          color: body.color,
          description: body.description,
          images: body.images,
          status: body.status || 'available'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(car, { status: 201 });

  } catch (error: any) {
    console.error('Error creating sale car:', error);
    return NextResponse.json({ error: 'Failed to create car', details: error.message }, { status: 500 });
  }
}
