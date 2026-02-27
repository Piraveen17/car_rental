import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const authz = await requireRole(supabase, ["admin", "staff"]);
    if (!authz.ok) return authz.errorResponse;
    const { data, error } = await supabase.from("car_unavailable").select("*").eq("car_id", id).order("start_date");
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const authz = await requireRole(supabase, ["admin", "staff"]);
    if (!authz.ok) return authz.errorResponse;
    const { startDate, endDate, reason, type } = await request.json();
    if (!startDate || !endDate || new Date(endDate) <= new Date(startDate))
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    const { data: conflict } = await supabase.from("bookings").select("id").eq("car_id", id).eq("status", "confirmed").lt("start_date", endDate).gt("end_date", startDate).maybeSingle();
    if (conflict) return NextResponse.json({ error: "Confirmed booking exists in this range" }, { status: 409 });
    const { data, error } = await supabase.from("car_unavailable").insert({ car_id: id, start_date: startDate, end_date: endDate, reason, type: type ?? "other", created_by: authz.user.id }).select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const authz = await requireRole(supabase, ["admin", "staff"]);
    if (!authz.ok) return authz.errorResponse;
    const blockId = new URL(request.url).searchParams.get("block_id");
    if (!blockId) return NextResponse.json({ error: "block_id required" }, { status: 400 });
    const { error } = await supabase.from("car_unavailable").delete().eq("id", blockId).eq("car_id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
