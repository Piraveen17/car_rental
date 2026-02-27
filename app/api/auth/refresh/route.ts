
import { NextResponse } from "next/server";
import { GATEWAY_URL } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json({ error: "Refresh token required" }, { status: 400 });
    }

    const res = await fetch(`${GATEWAY_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("POST /api/auth/refresh:", error);
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
  }
}
