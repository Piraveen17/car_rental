// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import Booking from "@/models/Booking";
import connectToDatabase from "@/lib/mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    const bookings = await Booking.find({});
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("GET /api/bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // basic validation
    if (!body.userId || !body.carId || !body.startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newBooking = new Booking({
      ...body,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await newBooking.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
