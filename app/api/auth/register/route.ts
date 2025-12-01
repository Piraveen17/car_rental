// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { name, email, password } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password required" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email });
    if (existing)
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );

    // Demo: store plain password only for dev. In production hash passwords before saving.
    const newUser = new User({
      id: uuidv4(),
      name,
      email,
      role: "customer",
      isActive: true,
      // password: hashedPassword, // production
      password, // demo only
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await newUser.save();

    const safeUser = {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/register:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
