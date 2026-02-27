import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { carFromDb } from "@/lib/mappers";
import { toCSV, toXLSX } from "@/lib/export";

function toInt(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toNum(v: string | null) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const authz = await requireRole(supabase, ["admin", "staff"]);
  if (!authz.ok) return authz.errorResponse;

  const url = new URL(req.url);
  const sp = url.searchParams;

  const q = sp.get("q") || sp.get("search");
  const brand = sp.get("brand") || sp.get("make");
  const location = sp.get("location");
  const transmission = sp.get("transmission");
  const seats = toInt(sp.get("seats"), 0);
  const priceMin = toNum(sp.get("price_min"));
  const priceMax = toNum(sp.get("price_max"));
  const yearMin = toInt(sp.get("year_min"), 0);
  const yearMax = toInt(sp.get("year_max"), 0);
  const type = sp.get("type");

  const sort = sp.get("sort") || "created_at";
  const order = (sp.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const format = (sp.get("format") || "csv").toLowerCase() === "xlsx" ? "xlsx" : "csv";

  let query = supabase.from("cars").select("*");

  if (brand && brand !== "all") query = query.eq("make", brand);
  if (location && location !== "all") query = query.eq("location", location);
  if (transmission && transmission !== "all") query = query.eq("transmission", transmission);
  if (seats) query = query.gte("seats", seats);
  if (priceMin !== undefined) query = query.gte("price_per_day", priceMin);
  if (priceMax !== undefined) query = query.lte("price_per_day", priceMax);
  if (yearMin) query = query.gte("year", yearMin);
  if (yearMax) query = query.lte("year", yearMax);
  if (type && type !== "all") {
    try {
      query = query.contains("features", [type]);
    } catch {
      // ignore
    }
  }
  if (q) {
    const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.or(`make.ilike.%${escaped}%,model.ilike.%${escaped}%,location.ilike.%${escaped}%`);
  }

  const sortMap: Record<string, string> = {
    created_at: "created_at",
    price: "price_per_day",
    price_per_day: "price_per_day",
    year: "year",
    seats: "seats",
    make: "make",
    status: "status",
  };
  const sortCol = sortMap[sort] || "created_at";
  query = query.order(sortCol, { ascending: order === "asc" });

  // export limit safeguard
  query = query.range(0, 9999);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to export cars" }, { status: 500 });

  const items = (data || []).map(carFromDb);
  const rows = items.map((c) => ({
    carId: c.carId,
    make: c.make,
    model: c.model,
    year: c.year,
    pricePerDay: c.pricePerDay,
    transmission: c.transmission,
    fuelType: c.fuelType,
    seats: c.seats,
    location: c.location,
    status: c.status,
  }));

  const columns = [
    "carId",
    "make",
    "model",
    "year",
    "pricePerDay",
    "transmission",
    "fuelType",
    "seats",
    "location",
    "status",
  ];

  const filename = `cars-export-${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === "xlsx") {
    const buffer = await toXLSX(rows, "Cars", columns);
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
