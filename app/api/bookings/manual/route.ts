import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permission
    const role = user.user_metadata?.role || 'customer';
    if (!['admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { 
        email, 
        name, 
        phone, 
        carId, 
        startDate, 
        endDate, 
        totalAmount, 
        paymentStatus = 'pending' 
    } = body;

    // We need admin rights to create users or check them without RLS issues
    const supabaseAdmin = createAdminClient();

    // 1. Find or Create User (Customer) in Supabase Auth
    // First, check if user exists by email
    let customerId: string | null = null;
    
    // Admin listUsers can be slow if many users, but for now it's strict. 
    // Better: Query public.users using admin client
    const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
        
    if (existingUser) {
        customerId = existingUser.id;
    } else {
        // Create new user in Auth
        // Generate a random password since it's manual booking ?? 
        // Or create without password (email invite)?
        // For simplicity: Create with temporary password and email verified = true
        // NOTE: This sends a confirmation email by default unless suppressed.
        
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
        
        try {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { name, role: 'customer' }
            });

            if (createError) throw createError;
            if (!newUser.user) throw new Error("Failed to create user object");
            
            customerId = newUser.user.id;
            
            // Sync to public.users (Trigger might handle this? 
            // If trigger uses NEW.raw_user_meta_data, it might work provided the trigger is set up on auth.users)
            
            // If we manually insert into public.users to be safe:
            const { error: profileError } = await supabaseAdmin
                .from('users')
                .upsert({
                    id: customerId,
                    email,
                    name,
                    phone,
                    role: 'customer'
                });
                
            if (profileError) {
                console.error("Profile creation error details:", profileError);
                throw profileError;
            }

        } catch (err: any) {
            console.error("User creation failed:", err);
            return NextResponse.json({ error: 'Failed to create customer account', details: err.message }, { status: 500 });
        }
    }

    // 2. Check Availability
    // We can use regular client since admins can view all bookings via RLS policies
    const { data: conflict } = await supabase
      .from('bookings')
      .select('id')
      .eq('car_id', carId)
      .in('status', ['confirmed', 'payment_pending'])
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: 'Car not available for selected dates' }, { status: 400 });
    }

    // 3. Create Booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            user_id: customerId,
            car_id: carId,
            start_date: startDate,
            end_date: endDate,
            total_amount: totalAmount,
            status: 'confirmed', // Manual bookings usually confirmed immediately
            payment_status: paymentStatus,
            booking_source: 'manual',
            created_by_role: role,
            created_by_user_id: user.id
        })
        .select()
        .single();

    if (bookingError) {
        throw bookingError;
    }

    return NextResponse.json(booking, { status: 201 });

  } catch (error: any) {
     console.error('Error creating manual booking:', error);
     return NextResponse.json({ error: 'Failed to create manual booking', details: error.message }, { status: 500 });
  }
}
