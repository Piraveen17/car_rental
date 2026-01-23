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
    
    const role = user.user_metadata?.role || 'customer';
    if (!['admin', 'staff'].includes(role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Map camelCase to snake_case if necessary, or just rely on body matching if updated
    // For safety, let's map common fields if they are mismatched
    const updates: any = { ...body };
    if (body.pricePerDay) updates.price_per_day = body.pricePerDay;
    if (body.fuelType) updates.fuel_type = body.fuelType;
    if (body.licensePlate) updates.license_plate = body.licensePlate;
    if (body.imageUrl) updates.image_url = body.imageUrl;

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
        
        const role = user.user_metadata?.role || 'customer';
        if (role !== 'admin') {
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
