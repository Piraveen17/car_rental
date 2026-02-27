import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { notifyRoles } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const authz = await requireRole(supabase, ["admin", "staff"]);
    if (!authz.ok) return authz.errorResponse;

    const url = new URL(request.url);
    const carId = url.searchParams.get("car_id");
    const bookingId = url.searchParams.get("booking_id");

    let query = supabase
      .from("damage_reports")
      .select("*, bookings(id, start_date, end_date), cars(make, model)")
      .order("created_at", { ascending: false });

    if (carId) query = query.eq("car_id", carId);
    if (bookingId) query = query.eq("booking_id", bookingId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { bookingId, carId, description, severity, images, estimatedRepairCost } = body;

    if (!bookingId || !carId || !description) {
      return NextResponse.json(
        { error: "bookingId, carId, and description are required" },
        { status: 400 }
      );
    }

    // Verify booking belongs to user OR user is staff/admin
    const { data: profile } = await supabase
      .from("users").select("role").eq("id", user.id).single();
    const isStaff = ["admin","staff"].includes(profile?.role ?? "");

    if (!isStaff) {
      const { data: booking } = await supabase
        .from("bookings").select("id").eq("id", bookingId).eq("user_id", user.id).single();
      if (!booking) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("damage_reports")
      .insert({
        booking_id: bookingId,
        car_id: carId,
        reported_by: user.id,
        description,
        severity: severity ?? "minor",
        images: images ?? [],
        estimated_repair_cost: estimatedRepairCost ?? null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Mark booking as damage_reported
    await supabase.from("bookings")
      .update({ damage_reported: true })
      .eq("id", bookingId);

    // Notify admin/staff
    await notifyRoles({
      roles: ["admin", "staff"],
      type: "general",
      title: "Damage Report Filed",
      body: `A ${severity ?? "minor"} damage report was filed for car ${carId}.`,
      href: `/admin/bookings?q=${bookingId}`,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
