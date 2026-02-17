import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { toCSV, toXLSX } from "@/lib/export";

export async function GET(req: Request) {
  const supabase = await createClient();
  const authz = await requireRole(supabase, ["admin"]);
  if (!authz.ok) return authz.errorResponse;

  const url = new URL(req.url);
  const sp = url.searchParams;

  const q = (sp.get("q") || "").trim().toLowerCase();
  const sort = sp.get("sort") || "created_at";
  const order = (sp.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const format = (sp.get("format") || "csv").toLowerCase() === "xlsx" ? "xlsx" : "csv";

  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .eq("role", "customer")
    .order(sort, { ascending: order === "asc" })
    .range(0, 9999);

  if (q) {
    query = query.or([`name.ilike.%${q}%`, `email.ilike.%${q}%`, `phone.ilike.%${q}%`, `id.ilike.%${q}%`].join(","));
  }

  const { data: users, error: usersErr } = await query;
  if (usersErr) return NextResponse.json({ error: "Failed to export customers" }, { status: 500 });

  const userIds = (users || []).map((u: any) => u.id);

  let bookings: any[] = [];
  if (userIds.length) {
    const { data, error } = await supabase
      .from("bookings")
      .select("user_id,total_amount,payment_status")
      .in("user_id", userIds);
    if (!error) bookings = data || [];
  }

  const statsByUser: Record<string, { totalBookings: number; totalSpent: number }> = {};
  for (const uid of userIds) statsByUser[uid] = { totalBookings: 0, totalSpent: 0 };

  for (const b of bookings) {
    const uid = b.user_id;
    if (!uid || !statsByUser[uid]) continue;
    statsByUser[uid].totalBookings += 1;
    if ((b.payment_status || "").toLowerCase() === "paid") {
      statsByUser[uid].totalSpent += Number(b.total_amount || 0);
    }
  }

  const rows = (users || []).map((u: any) => {
    const s = statsByUser[u.id] || { totalBookings: 0, totalSpent: 0 };
    return {
      userId: u.id,
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      createdAt: u.created_at,
      isActive: u.is_active ?? true,
      totalBookings: s.totalBookings,
      totalSpent: s.totalSpent,
    };
  });

  const columns = ["userId", "name", "email", "phone", "createdAt", "isActive", "totalBookings", "totalSpent"];

  const filename = `customers-export-${new Date().toISOString().slice(0, 10)}.${format}`;
  if (format === "xlsx") {
    const buffer = await toXLSX(rows, "Customers", columns);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  }

  const csv = toCSV(rows, columns);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
}
