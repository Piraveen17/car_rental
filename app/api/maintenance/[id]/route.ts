import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const gate = await requireRole(supabase, ['admin', 'staff']);
    if (!gate.ok) return gate.errorResponse;

    const { id } = await params;
    const body = await request.json();

    const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      body.status = 'pending';
    }

    const { data: updatedRecord, error } = await supabase
        .from('maintenance')
        .update({
            status: body.status,
            description: body.description || body.issue,
            estimated_cost: body.estimatedCost ?? body.cost,
            start_date: body.startDate ?? body.date,
            end_date: body.endDate,
            type: body.type,
            car_id: body.carId || body.car_id,
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
        issue: updatedRecord.description,
        carId: updatedRecord.car_id,
        startDate: updatedRecord.start_date,
        endDate: updatedRecord.end_date,
        estimatedCost: updatedRecord.estimated_cost,
        actualCost: updatedRecord.actual_cost,
        completedDate: updatedRecord.completed_date,
        mileageAtService: updatedRecord.mileage_at_service,
        serviceProvider: updatedRecord.service_provider,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
    });
  } catch (error) {
    console.error("Error updating maintenance:", error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const gate = await requireRole(supabase, ['admin', 'staff']);
    if (!gate.ok) return gate.errorResponse;

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
