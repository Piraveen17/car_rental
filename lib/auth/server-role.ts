import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function checkRole(allowedRoles: string[]) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Check role from metadata first (faster) or fallback to DB
  let role = user.user_metadata?.role;

  // Ideally, we trust metadata if we manage it carefully. 
  // If we need absolute consistency with DB table, we fetch it:
  if (!role) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      role = userProfile?.role;
  }

  if (!role || !allowedRoles.includes(role)) {
    redirect('/dashboard'); // Redirect unauthorized users to a safe place
  }

  return user;
}
