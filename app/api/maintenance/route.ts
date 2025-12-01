// app/api/maintenance/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import Maintenance from "@/models/Maintenance";
import connectToDatabase from "@/lib/mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    const records = await Maintenance.find({});
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("GET /api/maintenance:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    console.log(body);

    if (!body.carId || !body.issue || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newRecord = new Maintenance({
      ...body,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await newRecord.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /api/maintenance:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance record" },
      { status: 500 }
    );
  }
}
