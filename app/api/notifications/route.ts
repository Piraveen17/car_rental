import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Notifications API
 * Table expectation (Supabase):
 * notifications (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null,
 *   type text not null,
 *   title text not null,
 *   body text,
 *   href text,
 *   is_read boolean not null default false,
 *   created_at timestamptz not null default now()
 * )
 */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const unread = url.searchParams.get("unread") === "1" || url.searchParams.get("unread") === "true";

    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("page_size") || "10")));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (unread) query = query.eq("is_read", false);
    if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? data?.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items: data ?? [],
      meta: { total, page, pageSize, totalPages, sort: "created_at", order: "desc" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Allow any authenticated user to create a notification for themselves.
    // For system-wide/admin-triggered notifications, create on server with service role.
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const payload = {
      user_id: auth.user.id,
      type: String(body.type || "info"),
      title: String(body.title || "Notification"),
      body: body.body ? String(body.body) : null,
      href: body.href ? String(body.href) : null,
      is_read: false,
    };

    // Use service role for inserts to avoid RLS insert-policy dependency.
    const admin = createAdminClient();
    const { data, error } = await admin.from("notifications").insert(payload).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create notification" }, { status: 500 });
  }
}
