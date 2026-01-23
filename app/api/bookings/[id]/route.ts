import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/bookings/[id] (Admin/Staff)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    console.log("PUT called with params", params);
    // You cannot destructure params directly here if it's a promise in newer Next.js versions, 
    // but in Page Router / older App Router params is sync. 
    // Typescript signature says it's { params: { id: string } }.
  return PATCH(request, { params })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.user_metadata?.role || 'customer';
    
    // Check permissions - Admin/Staff can update any
    if (!['admin', 'staff'].includes(role)) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const { data: updatedBooking, error } = await supabase
        .from('bookings')
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') { // No rows returned/found
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        throw error;
    }

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
