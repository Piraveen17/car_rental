// app/api/maintenance/[id]/route.ts
import { NextResponse } from "next/server";
import Maintenance from "@/models/Maintenance";
import connectToDatabase from "@/lib/mongoose";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const rec = await Maintenance.findOne({ id: params.id });
    if (!rec)
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json(rec, { status: 200 });
  } catch (error) {
    console.error("GET /api/maintenance/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance record" },
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
    const id = req.url.split("/").pop();
    const updates = await req.json();
    const updated = await Maintenance.findOneAndUpdate(
      { recordId: id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    if (!updated)
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PUT /api/maintenance/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance record" },
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
    const deleted = await Maintenance.findOneAndDelete({ id: params.id });
    if (!deleted)
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json(
      { message: "Maintenance record deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/maintenance/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete maintenance record" },
      { status: 500 }
    );
  }
}
