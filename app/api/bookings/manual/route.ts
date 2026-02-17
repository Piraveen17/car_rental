import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/guards';
import { notifyUser } from '@/lib/notifications';
import { manualBookingSchema } from '@/lib/schemas/booking-schema';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const authz = await requireRole(supabase, ['admin', 'staff']);
    if (!authz.ok) return authz.errorResponse;
    const user = authz.user;

    const body = await req.json();
    
    // Validate with Zod
    const validation = manualBookingSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ 
            error: 'Validation failed', 
            details: validation.error.format() 
        }, { status: 400 });
    }

    const { 
        email, 
        name, 
        phone, 
        carId, 
        startDate, 
        endDate, 
        totalAmount, 
        paymentStatus 
    } = validation.data;

    // Use service-role client for all cross-user operations
    const supabaseAdmin = createAdminClient();

    // Determine creator role from DB (single source of truth)
    const { data: creatorProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const creatorRole = (creatorProfile?.role === 'admin') ? 'admin' : 'staff';

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

    // 2. Check Availability (same rule as customer booking)
    // Only CONFIRMED bookings block availability. Pending bookings do NOT block.
    const start = new Date(startDate);
    const end = new Date(endDate);

    const { data: conflict } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('car_id', carId)
      .eq('status', 'confirmed')
      .lt('start_date', end.toISOString())
      .gt('end_date', start.toISOString())
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: 'Car not available for selected dates' }, { status: 400 });
    }

    // Also block when car is unavailable (maintenance)
    const { data: maintenanceConflict } = await supabaseAdmin
      .from('car_unavailable')
      .select('id')
      .eq('car_id', carId)
      .lt('start_date', end.toISOString())
      .gt('end_date', start.toISOString())
      .maybeSingle();

    if (maintenanceConflict) {
      return NextResponse.json({ error: 'Car is under maintenance for selected dates' }, { status: 400 });
    }

    // 3. Create Booking
    const { data: booking, error: bookingError } = await supabaseAdmin
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
            created_by_role: creatorRole,
            created_by_user_id: user.id
        })
        .select()
        .single();

    if (bookingError) {
        throw bookingError;
    }

    // Best-effort: notify the customer that a manual booking was created/confirmed
    if (customerId) {
      void notifyUser({
        userId: customerId,
        type: 'booking_confirmed',
        title: 'Your booking is confirmed',
        body: `A booking was created for you from ${startDate} to ${endDate}.`,
        href: `/dashboard/bookings?q=${booking.id}`,
      });
    }

    return NextResponse.json(booking, { status: 201 });

  } catch (error: any) {
     console.error('Error creating manual booking:', error);
     return NextResponse.json({ error: 'Failed to create manual booking', details: error.message }, { status: 500 });
  }
}
