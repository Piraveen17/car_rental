import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { data: isAuthorized } = await supabase.rpc('is_role', { roles: ['admin', 'staff'] });
    if (!isAuthorized) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.status) {
        if (!['pending', 'fixed'].includes(body.status)) {
             if (body.status === 'completed' || body.status === 'fixed') body.status = 'fixed';
             else body.status = 'pending';
        }
    }

    const { data: updatedRecord, error } = await supabase
        .from('maintenance')
        .update({
            status: body.status, 
            description: body.description || body.issue, 
            cost: body.cost,
            date: body.date,
            type: body.type,
            car_id: body.carId || body.car_id
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
         if (error.code === 'PGRST116') return NextResponse.json({ error: 'Record not found' }, { status: 404 });
         throw error;
    }

    return NextResponse.json({
        ...updatedRecord,
        recordId: updatedRecord.id,
        issue: updatedRecord.description
    });
  } catch (error) {
    console.error("Error updating maintenance:", error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { data: isAuthorized } = await supabase.rpc('is_role', { roles: ['admin', 'staff'] });
    if (!isAuthorized) { // Matching DB policy where staff can manage maintenance
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
     console.error("Error deleting maintenance:", error);
     return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
