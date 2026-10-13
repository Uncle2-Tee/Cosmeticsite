import { NextResponse } from "next/server";
import { hashPassword } from "../../../../lib/customer-auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid sign-up details." }, { status: 400 });
  }

  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (fullName.length < 2 || fullName.length > 120
    || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Enter a valid name and email, and a password between 8 and 128 characters." }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(password);
    await prisma.customerProfile.create({
      data: { fullName, email, passwordHash },
    });
    return NextResponse.json({ message: "Account created. Please log in." }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists. Log in instead." }, { status: 409 });
    }
    console.error("Could not create customer account:", error);
    return NextResponse.json({ error: "Could not create your account. Please try again." }, { status: 500 });
  }
}
