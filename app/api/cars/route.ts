import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { carFromDb, carToDbInsert } from "@/lib/mappers";

function toInt(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toNum(v: string | null) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

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

    const url = new URL(req.url);
    const sp = url.searchParams;

    // URL query params (SEO/shareable)
    const q = sp.get('q') || sp.get('search');
    const brand = sp.get('brand') || sp.get('make');
    const location = sp.get('location');
    const transmission = sp.get('transmission');
    const seats = toInt(sp.get('seats'), 0);
    const priceMin = toNum(sp.get('price_min'));
    const priceMax = toNum(sp.get('price_max'));
    const yearMin = toInt(sp.get('year_min'), 0);
    const yearMax = toInt(sp.get('year_max'), 0);
    const type = sp.get('type'); // optional: mapped to features[] contains

    const page = Math.max(1, toInt(sp.get('page'), 1));
    const pageSize = Math.min(48, Math.max(6, toInt(sp.get('page_size') || sp.get('limit'), 12)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const sort = sp.get('sort') || 'created_at';
    const order = (sp.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = supabase
      .from('cars')
      .select('*', { count: 'exact' });

    if (!isAdminOrStaff) {
      // Public users only see 'active' cars
      query = query.eq('status', 'active');
    }

    // Filters
    if (brand && brand !== 'all') query = query.eq('make', brand);
    if (location && location !== 'all') query = query.eq('location', location);
    if (transmission && transmission !== 'all') query = query.eq('transmission', transmission);
    if (seats) query = query.gte('seats', seats);
    if (priceMin !== undefined) query = query.gte('price_per_day', priceMin);
    if (priceMax !== undefined) query = query.lte('price_per_day', priceMax);
    if (yearMin) query = query.gte('year', yearMin);
    if (yearMax) query = query.lte('year', yearMax);

    // Optional: treat `type` as a tag inside features[] (Postgres text[])
    if (type && type !== 'all') {
      try {
        query = query.contains('features', [type]);
      } catch {
        // ignore if DB column type doesn't support contains
      }
    }

    if (q) {
      // Search across make/model/location
      const escaped = q.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(
        `make.ilike.%${escaped}%,model.ilike.%${escaped}%,location.ilike.%${escaped}%`
      );
    }

    // Sort mapping
    const sortMap: Record<string, string> = {
      created_at: 'created_at',
      price: 'price_per_day',
      price_per_day: 'price_per_day',
      year: 'year',
      seats: 'seats',
      make: 'make',
    };
    const sortCol = sortMap[sort] || 'created_at';
    query = query.order(sortCol, { ascending: order === 'asc' }).range(from, to);

    const { data: cars, error, count } = await query;
    if (error) throw error;

    const formattedCars = cars.map(carFromDb);

    const response = NextResponse.json({
      items: formattedCars,
      meta: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
        sort: sortCol,
        order,
      },
    });
    
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
    const auth = await requireRole(supabase, ["admin", "staff"]);
    if (!auth.ok) return auth.errorResponse;

    const body = await req.json();
    const payload = carToDbInsert(body);

    const { data: car, error } = await supabase
      .from("cars")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(carFromDb(car), { status: 201 });
  } catch (error: any) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Failed to create car', details: error.message }, { status: 500 });
  }
}
