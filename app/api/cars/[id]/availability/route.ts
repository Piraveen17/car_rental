import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch car — select both column name variants so it works whether
    //    the DB was set up from schema.sql (min_days) or supabase_production.sql (min_rental_days)
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("*")
      .eq("car_id", id)
      .single();

    if (carError || !car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // Normalize column name differences between schema versions
    const minDays: number = car.min_rental_days ?? car.min_days ?? 1;
    const maxDays: number = car.max_rental_days ?? car.max_days ?? 30;

    // 2. Only CONFIRMED bookings block the calendar.
    //    Pending = awaiting staff approval, does NOT block.
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("start_date, end_date")
      .eq("car_id", id)
      .eq("status", "confirmed");

    if (bookingError) throw bookingError;

    // 3. Admin-managed unavailable ranges (maintenance windows, private blocks, etc.)
    //    This table may not exist on older installs — handle gracefully.
    let unavailable: { start_date: string; end_date: string; reason?: string; type?: string }[] = [];
    try {
      const { data: uData, error: uError } = await supabase
        .from("car_unavailable")
        .select("start_date, end_date, reason, type")
        .eq("car_id", id);
      if (!uError) unavailable = uData ?? [];
    } catch {
      // table doesn't exist yet — safe to ignore
    }

    // 4. Build blocked ranges list
    const blockedDates = [
      ...(bookings ?? []).map((b) => ({
        from: b.start_date,
        to: b.end_date,
        type: "booking" as const,
      })),
      ...unavailable.map((u) => ({
        from: u.start_date,
        to: u.end_date,
        type: (u.type ?? "maintenance") as "maintenance" | "reserved" | "other",
        reason: u.reason,
      })),
    ];

    return NextResponse.json({
      carId: id,
      minDays,
      maxDays,
      blockedDates,
      carStatus: car.status,
      isAvailable: car.status === "active",
    });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
