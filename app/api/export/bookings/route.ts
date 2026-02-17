import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { toCSV, toXLSX } from "@/lib/export";

export async function GET(req: Request) {
  const supabase = await createClient();
  const authz = await requireRole(supabase, ["admin", "staff"]);
  if (!authz.ok) return authz.errorResponse;

  const url = new URL(req.url);
  const sp = url.searchParams;

  const q = (sp.get("q") || "").trim().toLowerCase();
  const status = (sp.get("status") || "").trim();
  const paymentStatus = (sp.get("payment_status") || sp.get("paymentStatus") || "").trim();
  const carId = (sp.get("car_id") || sp.get("carId") || "").trim();
  const userId = (sp.get("user_id") || sp.get("userId") || "").trim();
  const dateFrom = sp.get("date_from");
  const dateTo = sp.get("date_to");
  const sort = sp.get("sort") || "created_at";
  const order = (sp.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const format = (sp.get("format") || "csv").toLowerCase() === "xlsx" ? "xlsx" : "csv";

  let query = supabase
    .from("bookings")
    .select("*, cars (make, model), users (name, email)")
    .order(sort, { ascending: order === "asc" })
    .range(0, 9999);

  if (userId) query = query.eq("user_id", userId);
  if (carId) query = query.eq("car_id", carId);
  if (status) query = query.eq("status", status);
  if (paymentStatus) query = query.eq("payment_status", paymentStatus);
  if (dateFrom) query = query.gte("start_date", dateFrom);
  if (dateTo) query = query.lte("end_date", dateTo);

  if (q) {
    query = query.or(
      [
        `id.ilike.%${q}%`,
        `cars.make.ilike.%${q}%`,
        `cars.model.ilike.%${q}%`,
        `users.name.ilike.%${q}%`,
        `users.email.ilike.%${q}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to export bookings" }, { status: 500 });

  const rows = (data || []).map((b: any) => ({
    bookingId: b.id,
    userId: b.user_id,
    customerName: b.users?.name || "",
    customerEmail: b.users?.email || "",
    carId: b.car_id,
    car: `${b.cars?.make || ""} ${b.cars?.model || ""}`.trim(),
    startDate: b.start_date,
    endDate: b.end_date,
    totalAmount: b.total_amount,
    paymentStatus: b.payment_status,
    bookingStatus: b.status,
    createdAt: b.created_at,
  }));

  const columns = [
    "bookingId",
    "userId",
    "customerName",
    "customerEmail",
    "carId",
    "car",
    "startDate",
    "endDate",
    "totalAmount",
    "paymentStatus",
    "bookingStatus",
    "createdAt",
  ];

  const filename = `bookings-export-${new Date().toISOString().slice(0, 10)}.${format}`;
  if (format === "xlsx") {
    const buffer = await toXLSX(rows, "Bookings", columns);
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
