import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data: car, error } = await supabase
        .from('sale_cars')
        .select('*')
        .eq('id', id)
        .single(); // using single() ensures we get one or error

    if (error) {
       if (error.code === 'PGRST116') return NextResponse.json({ error: 'Car not found' }, { status: 404 });
       throw error;
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error("Error fetching sale car:", error);
    return NextResponse.json({ error: 'Failed to fetch car' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = user.user_metadata?.role || 'customer';
    if (!['admin', 'staff'].includes(role)) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const { data: updatedCar, error } = await supabase
        .from('sale_cars')
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') return NextResponse.json({ error: 'Car not found' }, { status: 404 });
        throw error;
    }

    return NextResponse.json(updatedCar);
  } catch (error: any) {
    console.error("Error updating sale car:", error);
    return NextResponse.json({ error: 'Failed to update car' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Check role - Only admin delete? Original code said yes.
    const role = user.user_metadata?.role || 'customer';
    if (role !== 'admin') {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    
    const { error } = await supabase
        .from('sale_cars')
        .delete()
        .eq('id', id);

    if (error) {
        if (error.code === 'PGRST116') return NextResponse.json({ error: 'Car not found' }, { status: 404 });
        throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting sale car:", error);
    return NextResponse.json({ error: 'Failed to delete car' }, { status: 500 });
  }
}
