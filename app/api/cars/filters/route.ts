import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns all distinct filter options for the cars listing page.
 * Used to populate the sidebar filter dropdowns.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: cars, error } = await supabase
      .from("cars")
      .select("make, location, transmission, fuel_type, seats, year")
      .eq("status", "active");

    if (error) throw error;

    const toSet = (arr: (string | number | null | undefined)[]) =>
      Array.from(new Set(arr.filter(Boolean))).sort();

    return NextResponse.json({
      makes: toSet(cars?.map((c) => c.make) ?? []),
      locations: toSet(cars?.map((c) => c.location) ?? []),
      transmissions: toSet(cars?.map((c) => c.transmission) ?? []),
      fuelTypes: toSet(cars?.map((c) => c.fuel_type) ?? []),
      seats: toSet(cars?.map((c) => c.seats).filter((s) => s != null) ?? []).map(Number).sort((a, b) => a - b),
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}
