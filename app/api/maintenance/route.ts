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
    const sort = sp.get('sort') || 'created_at';
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
        issue: r.description, // Map description to issue for client compatibility
        carId: r.car_id,
        startDate: r.start_date,
        endDate: r.end_date,
        estimatedCost: r.estimated_cost,
        actualCost: r.actual_cost,
        completedDate: r.completed_date,
        mileageAtService: r.mileage_at_service,
        serviceProvider: r.service_provider,
        createdAt: r.created_at,
        updatedAt: r.updated_at
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
    
    const { carId, issue, estimatedCost, cost, type, startDate, date } = body;
    const dbCarId = carId || body.car_id;
    const dbDescription = issue || body.description;
    const dbStartDate = startDate || date;
    const dbEstimatedCost = estimatedCost ?? cost ?? 0;

    // Validate status against DB CHECK constraint
    const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
    let status = body.status || 'pending';
    if (!VALID_STATUSES.includes(status)) status = 'pending';

    // Validate type against DB CHECK constraint
    const VALID_TYPES = ['oil_change','tire_rotation','brake_service','engine_repair','transmission','electrical','body_work','inspection','repair','other'];
    let type_val = type || 'repair';
    if (!VALID_TYPES.includes(type_val)) type_val = 'repair';

    const { data: record, error } = await supabase
      .from('maintenance')
      .insert({
          car_id: dbCarId,
          type: type_val,
          description: dbDescription,
          start_date: dbStartDate,
          estimated_cost: dbEstimatedCost,
          status,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
        ...record,
        recordId: record.id,
        issue: record.description,
        carId: record.car_id,
        startDate: record.start_date,
        endDate: record.end_date,
        estimatedCost: record.estimated_cost,
        actualCost: record.actual_cost,
        completedDate: record.completed_date,
        mileageAtService: record.mileage_at_service,
        serviceProvider: record.service_provider,
        createdAt: record.created_at,
        updatedAt: record.updated_at
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating maintenance:", error);
    return NextResponse.json({ error: 'Failed to create record', details: error.message }, { status: 500 });
  }
}
