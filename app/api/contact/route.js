
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // hier kannst du MongoDB direkt aus Next.js verbinden oder Request an dein Express-Backend weiterleiten
    return NextResponse.json(
      { message: "Message received successfully!" },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
