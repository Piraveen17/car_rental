import { NextResponse } from "next/server";
import { Car } from "@/models/Car";
import connectToDatabase from "@/lib/mongoose";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const car = await Car.findOne({ id: params.id });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(car, { status: 200 });
  } catch (error) {
    console.error("GET /api/cars/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch car" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const updates = await req.json();

    const id = req.url.split("/").pop();

    const updatedCar = await Car.findOneAndUpdate(
      { carId: id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    //console.log(updatedCar);

    return NextResponse.json(updatedCar, { status: 200 });
  } catch (error) {
    console.error("PUT /api/cars/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
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

    await Car.findOneAndDelete({ id: params.id });

    return NextResponse.json(
      { message: "Car deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/cars/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    );
  }
}
