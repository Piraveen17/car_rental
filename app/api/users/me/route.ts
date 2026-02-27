import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, nicPassport, nic_passport } = body;

    // Allowed updates
    const updates: any = {
        updated_at: new Date().toISOString()
    };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    // Map nicPassport (camelCase) to nic_passport (snake_case)
    if (nicPassport !== undefined) updates.nic_passport = nicPassport;
    if (nic_passport !== undefined) updates.nic_passport = nic_passport; 

    // Update public.users
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
        throw error;
    }

    // Also update auth.users metadata if needed/possible (optional, but good for consistency if metadata is used)
    // Supabase auth.updateUser() allows updating metadata
    const { error: authError } = await supabase.auth.updateUser({
        data: {
            name: name || undefined,
            // phone is separate in auth, but usually we keep it in metadata or phone attr
        }
    });
    if (authError) {
        console.warn("Failed to update auth metadata", authError);
    }

    return NextResponse.json({
        ...updatedProfile,
        // map back to camelCase for client consistency
        nicPassport: updatedProfile.nic_passport 
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 });
  }
}
