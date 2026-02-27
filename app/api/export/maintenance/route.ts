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
  const carId = (sp.get("car_id") || sp.get("carId") || "").trim();
  const sort = sp.get("sort") || "start_date";
  const order = (sp.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const format = (sp.get("format") || "csv").toLowerCase() === "xlsx" ? "xlsx" : "csv";

  let query = supabase
    .from("maintenance")
    .select("*, cars (make, model)")
    .order(sort, { ascending: order === "asc" })
    .range(0, 9999);

  if (status) query = query.eq("status", status);
  if (carId) query = query.eq("car_id", carId);
  if (q) {
    query = query.or([`description.ilike.%${q}%`, `type.ilike.%${q}%`, `cars.make.ilike.%${q}%`, `cars.model.ilike.%${q}%`].join(","));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to export maintenance" }, { status: 500 });

  const rows = (data || []).map((r: any) => ({
    recordId: r.id,
    carId: r.car_id,
    car: `${r.cars?.make || ""} ${r.cars?.model || ""}`.trim(),
    type: r.type,
    issue: r.description,
    date: r.start_date,
    cost: r.estimated_cost,
    status: r.status,
    createdAt: r.created_at,
  }));

  const columns = ["recordId", "carId", "car", "type", "issue", "date", "cost", "status", "createdAt"];
  const filename = `maintenance-export-${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === "xlsx") {
    const buffer = await toXLSX(rows, "Maintenance", columns);
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
