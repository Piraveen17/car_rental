import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let isAdminOrStaff = false;

    if (user) {
      const role = user.user_metadata?.role || 'customer';
      if (['admin', 'staff'].includes(role)) {
        isAdminOrStaff = true;
      }
    }

    let query = supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdminOrStaff) {
      // Assuming 'available' is the public status equivalent to 'active'
      query = query.eq('status', 'available');
    }

    const { data: cars, error } = await query;
    if (error) throw error;

    const formattedCars = cars.map(car => ({
      ...car,
      car_id: car.car_id, // Compat
      id: car.car_id
    }));

    return NextResponse.json(formattedCars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role || 'customer';
    if (role !== 'admin') {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // // DEBUG: Check public.users role
    // const { data: dbUser, error: dbError } = await supabase
    //   .from('users')
    //   .select('*')
    //   .eq('id', user.id)
    //   .single();
    // if (dbError) console.error('Error fetching public user:', dbError);
    // console.log('DB User Role:', dbUser?.role, 'Metadata Role:', role); 
    // // END DEBUG


    const { data: car, error } = await supabase
      .from('cars')
      .insert({
        car_id: body.car_id,
          make: body.make,
          model: body.model,
          year: body.year,
          price_per_day: body.price_per_day, 
          transmission: body.transmission,
          fuel_type: body.fuel_type,
          seats: body.seats,
          status: body.status || 'active',
          images: body.images || [],
          features: body.features || [],
          location: body.location,
          description: body.description,

      })
      .select()
      .single();


    if (error) throw error;

    return NextResponse.json({
        ...car,
        car_id: car.car_id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Failed to create car', details: error.message }, { status: 500 });
  }
}
