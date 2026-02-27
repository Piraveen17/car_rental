import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { carFromDb, carToDbUpdate } from "@/lib/mappers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: car, error } = await supabase
        .from('cars')
        .select('*')
        .eq('car_id', id)
        .single();

    if (error) {
         if (error.code === 'PGRST116') return NextResponse.json({ error: 'Car not found' }, { status: 404 });
         throw error;
    }

    return NextResponse.json(carFromDb(car));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch car" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const auth = await requireRole(supabase, ["admin", "staff"]);
    if (!auth.ok) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const updates = carToDbUpdate(body);

    const { data: updatedCar, error } = await supabase
      .from("cars")
      .update(updates)
      .eq("car_id", id)
      .select("*")
      .single();

    if (error) {
      // PGRST116: no rows
      if ((error as any).code === "PGRST116") {
        return NextResponse.json({ error: "Car not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(carFromDb(updatedCar));
  } catch (error: any) {
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Failed to update car", details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const auth = await requireRole(supabase, ["admin"]);
    if (!auth.ok) return auth.errorResponse;

    const { id } = await params;
    const { error } = await supabase.from("cars").delete().eq("car_id", id);
    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Cannot delete this car because it has associated bookings or maintenance records. Please set its status to Inactive instead." },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Failed to delete car", details: error?.message },
      { status: 500 }
    );
  }
}
