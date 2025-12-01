// app/api/payments/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { DemoPayment } from "@/models/DemoPayment";
import connectToDatabase from "@/lib/mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    const payments = await DemoPayment.find({});
    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error("GET /api/payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.bookingId || typeof body.amount !== "number") {
      return NextResponse.json(
        { error: "bookingId and amount required" },
        { status: 400 }
      );
    }

    const paymentId = uuidv4();
    const newPayment = new DemoPayment({
      id: uuidv4(),
      bookingId: body.bookingId,
      paymentId,
      amount: body.amount,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await newPayment.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /api/payments:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
