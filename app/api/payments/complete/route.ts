// app/api/payments/complete/route.ts
import { NextResponse } from "next/server";
import {DemoPayment} from "@/models/DemoPayment";
import connectToDatabase from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { paymentId } = await req.json() as { paymentId?: string };
    if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

    const payment = await DemoPayment.findOne({ paymentId });
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    payment.status = "paid";
    payment.updatedAt = new Date();
    await payment.save();

    return NextResponse.json({ success: true, payment }, { status: 200 });
  } catch (error) {
    console.error("POST /api/payments/complete:", error);
    return NextResponse.json({ error: "Failed to complete payment" }, { status: 500 });
  }
}
