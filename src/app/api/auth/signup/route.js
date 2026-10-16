import { NextResponse } from "next/server";
import { hashPassword } from "../../../../lib/customer-auth";
import { normalizeCustomerIdentifier } from "../../../../lib/customer-identity";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid sign-up details." }, { status: 400 });
  }

  const contact = normalizeCustomerIdentifier(body?.identifier);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!contact || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Enter a valid email or phone number and a password between 8 and 128 characters." }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(password);
    const profile = await prisma.$transaction(async (transaction) => {
      const challenge = await transaction.customerVerification.findUnique({ where: { identifier: contact.identifier } });
      if (!challenge || !challenge.verifiedAt || challenge.expiresAt <= new Date()) return null;

      const existing = await transaction.customerProfile.findUnique({
        where: contact.type === "email" ? { email: contact.email } : { phone: contact.phone },
        select: { id: true },
      });
      if (existing) return "existing";

      const created = await transaction.customerProfile.create({
        data: { email: contact.email, phone: contact.phone, passwordHash },
      });
      await transaction.customerVerification.delete({ where: { id: challenge.id } });
      return created;
    });

    if (profile === "existing") {
      return NextResponse.json({ error: "An account with this contact already exists. Log in instead.", existingAccount: true }, { status: 409 });
    }
    if (!profile) {
      return NextResponse.json({ error: "Verify your email or phone number before creating an account." }, { status: 400 });
    }
    return NextResponse.json({ message: "Account created. Enter your password to log in." }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "An account with this contact already exists. Log in instead.", existingAccount: true }, { status: 409 });
    }
    console.error("Could not create customer account:", error);
    return NextResponse.json({ error: "Could not create your account. Please try again." }, { status: 500 });
  }
}
