import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check availability logic using admin/staff check
    // If usage of RPC is problematic for public (unauthenticated), we handle public case.
    // user might be null.
    
    let isAdminOrStaff = false;
    if (user) {
        const { data } = await supabase.rpc('is_role', { roles: ['admin', 'staff'] });
        isAdminOrStaff = !!data;
    }

    let query = supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdminOrStaff) {
      // Public users only see 'active' cars
      query = query.eq('status', 'active');
    }

    const { data: cars, error } = await query;
    if (error) throw error;

    const formattedCars = cars.map(car => ({
      ...car,
      carId: car.car_id, // Map DB snake_case -> API camelCase (though client normalizes it too)
      pricePerDay: car.price_per_day,
      fuelType: car.fuel_type
    }));

    const response = NextResponse.json(formattedCars);
    
    // Cache for 60 seconds, revalidate in background
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
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

    const { data: isAuthorized } = await supabase.rpc('is_role', { roles: ['admin'] });
    if (!isAuthorized) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    
    // Accept camelCase from frontend, map to snake_case for DB
    const { 
      carId, 
      make, 
      model, 
      year, 
      pricePerDay, 
      transmission, 
      fuelType, 
      seats, 
      status, 
      images, 
      features, 
      location, 
      description 
    } = body;

    const { data: car, error } = await supabase
      .from('cars')
      .insert({
          car_id: carId || body.car_id, // Fallback
          make,
          model,
          year,
          price_per_day: pricePerDay, 
          transmission,
          fuel_type: fuelType,
          seats,
          status: status || 'active',
          images: images || [],
          features: features || [],
          location,
          description,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
        ...car,
        carId: car.car_id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Failed to create car', details: error.message }, { status: 500 });
  }
}
