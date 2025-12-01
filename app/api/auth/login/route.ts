// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json() as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Demo: no password hashing in example. In production verify hashed password.
    // If your User model stores hashed password, compare with bcrypt here.
    // Example:
    // const isValid = await bcrypt.compare(password, user.passwordHash);

    // For demo, accept any provided password:
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (error) {
    console.error("POST /api/auth/login:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
