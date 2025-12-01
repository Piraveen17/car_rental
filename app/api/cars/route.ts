import { NextResponse } from "next/server";
import { Car } from "@/models/Car";
import connectToDatabase from "@/lib/mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    const cars = await Car.find({});
    return NextResponse.json(cars, { status: 200 });
  } catch (error) {
    console.error("GET /api/cars:", error);
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const newCar = new Car(body);
    const savedCar = await newCar.save();

    return NextResponse.json(savedCar, { status: 201 });
  } catch (error) {
    console.error("POST /api/cars error:", error);
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 }
    );
  }
}
