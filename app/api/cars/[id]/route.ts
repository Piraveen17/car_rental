import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: car, error } = await supabase
        .from('cars')
        .select('*')
        .eq('car_id', id)
        .single();

    if (error) {
         if (error.code === 'PGRST116') return NextResponse.json({ error: 'Car not found' }, { status: 404 });
         throw error;
    }

    return NextResponse.json({
        ...car,
        carId: car.id,
        id: car.id
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch car' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { data: isAuthorized } = await supabase.rpc('is_role', { roles: ['admin'] });
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Map camelCase to snake_case if necessary
    const updates: any = { 
       ...body,
       // Normalize basic fields that might differ or be optional
       images: body.images,
       features: body.features
    };
    if (body.pricePerDay) updates.price_per_day = body.pricePerDay;
    if (body.fuelType) updates.fuel_type = body.fuelType;
    if (body.seats) updates.seats = body.seats;
    if (body.status) updates.status = body.status;
    
    // Legacy cleanup
    delete updates.pricePerDay;
    delete updates.fuelType;
    delete updates.cardId;
    delete updates.carId; // Immutable

    const { data: updatedCar, error } = await supabase
        .from('cars')
        .update(updates)
        .eq('car_id', id)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') return NextResponse.json({ error: 'Car not found' }, { status: 404 });
        throw error;
    }

    return NextResponse.json({
        ...updatedCar,
        carId: updatedCar.id,
        id: updatedCar.id
    });

  } catch (error: any) {
     return NextResponse.json({ error: 'Failed to update car', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(request, { params });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const { data: isAuthorized } = await supabase.rpc('is_role', { roles: ['admin'] });
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
    
        const { id } = await params;
        const { error } = await supabase
            .from('cars')
            .delete()
            .eq('car_id', id);
    
        if (error) throw error;
    
        return NextResponse.json({ success: true });
    
      } catch (error: any) {
         return NextResponse.json({ error: 'Failed to delete car', details: error.message }, { status: 500 });
      }
}
