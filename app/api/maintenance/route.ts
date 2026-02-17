import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';

// GET /api/maintenance (Admin/Staff only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const authz = await requireRole(supabase, ['admin', 'staff']);
    if (!authz.ok) return authz.errorResponse;

    const url = new URL(request.url);
    const sp = url.searchParams;

    const page = Math.max(1, Number(sp.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(5, Number(sp.get('page_size') || sp.get('limit') || '10')));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const q = (sp.get('q') || '').trim().toLowerCase();
    const status = (sp.get('status') || '').trim();
    const carId = (sp.get('car_id') || sp.get('carId') || '').trim();
    const sort = sp.get('sort') || 'date';
    const order = (sp.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = supabase
      .from('maintenance')
      .select('*, cars (make, model)', { count: 'exact' })
      .order(sort, { ascending: order === 'asc' })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (carId) query = query.eq('car_id', carId);
    if (q) {
      query = query.or(
        [
          `description.ilike.%${q}%`,
          `type.ilike.%${q}%`,
          `cars.make.ilike.%${q}%`,
          `cars.model.ilike.%${q}%`,
        ].join(',')
      );
    }

    const { data: records, error, count } = await query;
    
    if (error) throw error;

    const formattedRecords = (records || []).map(r => ({
        ...r,
        recordId: r.id, // Map id to recordId for client compatibility
        issue: r.description // Map description to issue for client compatibility
    }));

    return NextResponse.json({
      items: formattedRecords,
      meta: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
        sort,
        order,
      },
    });
  } catch (error: any) {
    console.error("Error fetching maintenance:", error);
    return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 });
  }
}

// POST /api/maintenance (Admin/Staff)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authz = await requireRole(supabase, ['admin', 'staff']);
    if (!authz.ok) return authz.errorResponse;

    const body = await request.json();
    
    // Accept camelCase from frontend (newRecord in store.ts has camelCase)
    // Map to snake_case for DB
    const { carId, issue, date, cost, type, description } = body;
    const dbCarId = carId || body.car_id;
    const dbIssue = issue || description || body.description;

    // Sanitize status to ensure it matches DB constraint (pending | fixed)
    let status = body.status || 'pending';
    if (!['pending', 'fixed'].includes(status)) {
        if (status === 'completed' || status === 'fixed') status = 'fixed';
        else status = 'pending'; // Default everything else (scheduled, in_progress) to pending
    }

    const { data: record, error } = await supabase
      .from('maintenance')
      .insert({
          car_id: dbCarId,
          type: type || 'repair', 
          description: dbIssue,
          date,
          cost,
          status: status
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
        ...record,
        recordId: record.id,
        // issue: record.description // optional, frontend logic handles it? IMaintenance has issue, DB has description
        issue: record.description
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating maintenance:", error);
    return NextResponse.json({ error: 'Failed to create record', details: error.message }, { status: 500 });
  }
}
