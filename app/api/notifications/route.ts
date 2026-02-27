import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const unread = url.searchParams.get("unread") === "1" || url.searchParams.get("unread") === "true";
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("page_size") || "20")));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (unread) query = query.eq("read", false);  // column is "read" not "is_read"
    if (q) query = query.or(`title.ilike.%${q}%,message.ilike.%${q}%`);  // column is "message" not "body"

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      items: data ?? [],
      meta: {
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .insert({
        user_id: auth.user.id,
        type: String(body.type || "info"),
        title: String(body.title || "Notification"),
        message: body.message || body.body || "",  // accept both, store as "message"
        href: body.href ? String(body.href) : null,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create notification" }, { status: 500 });
  }
}
