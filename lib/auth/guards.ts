import { NextResponse } from "next/server";

/**
 * Route helpers (server-side).
 * Prefer `is_role` RPC when available, fall back to user metadata.
 */

export async function requireUser(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, errorResponse: null as any };
}

export async function requireRole(supabase: any, roles: string[]) {
  const { user, errorResponse } = await requireUser(supabase);
  if (errorResponse) return { ok: false, user: null, errorResponse };

  try {
    const { data } = await supabase.rpc("is_role", { roles });
    if (data) return { ok: true, user, errorResponse: null as any };
  } catch {
    // ignore and fall back
  }

  // Fallback: use auth metadata, then DB profile role (public.users.role)
  let role = user?.user_metadata?.role as string | undefined;
  if (!role) {
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = profile?.role;
    } catch {
      // ignore
    }
  }
  role = role || "customer";
  if (!roles.includes(role)) {
    return {
      ok: false,
      user: null,
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user, errorResponse: null as any };
}
