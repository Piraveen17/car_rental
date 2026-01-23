import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/maintenance (Admin/Staff only)
export async function GET(request: Request) {
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

    const { data: records, error } = await supabase
      .from('maintenance')
      .select('*, cars (make, model)')
      .order('date', { ascending: false });
    
    if (error) throw error;

    const formattedRecords = (records || []).map(r => ({
        ...r,
        recordId: r.id, // Map id to recordId for client compatibility
        issue: r.description // Map description to issue for client compatibility
    }));

    return NextResponse.json(formattedRecords);
  } catch (error: any) {
    console.error("Error fetching maintenance:", error);
    return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 });
  }
}

// POST /api/maintenance (Admin/Staff)
export async function POST(request: Request) {
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

    const body = await request.json();
    
    // Sanitize status to ensure it matches DB constraint (pending | fixed)
    let status = body.status || 'pending';
    if (!['pending', 'fixed'].includes(status)) {
        if (status === 'completed' || status === 'fixed') status = 'fixed';
        else status = 'pending'; // Default everything else (scheduled, in_progress) to pending
    }

    const { data: record, error } = await supabase
      .from('maintenance')
      .insert({
          car_id: body.car_id,
          type: body.type || 'repair', // Default to repair
          description: body.issue || body.description,
          date: body.date,
          cost: body.cost,
          status: status
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
        ...record,
        recordId: record.id,
        issue: record.description
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating maintenance:", error);
    return NextResponse.json({ error: 'Failed to create record', details: error.message }, { status: 500 });
  }
}
