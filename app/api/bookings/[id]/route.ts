// app/api/bookings/[id]/route.ts
import { NextResponse } from "next/server";
import Booking from "@/models/Booking";
import connectToDatabase from "@/lib/mongoose";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const booking = await Booking.findOne({ id: params.id });
    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error("GET /api/bookings/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const updates = await req.json();
    const updated = await Booking.findOneAndUpdate(
      { id: params.id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    if (!updated)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PUT /api/bookings/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const deleted = await Booking.findOneAndDelete({ id: params.id });
    if (!deleted)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ message: "Booking deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/bookings/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
