import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/leads (Admin only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.user_metadata?.role || 'customer';
    if (role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*, sale_cars (make, model, year)')
      .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// POST /api/leads (Public)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // Validate required fields
    if (!body.saleCarId || !body.name || !body.email) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
          sale_car_id: body.saleCarId,
          name: body.name,
          email: body.email,
          phone: body.phone,
          message: body.message,
          status: 'new'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
     console.error("Error creating lead:", error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
