import { NextResponse } from "next/server";
import { createCustomerSession, customerSessionCookieOptions, CUSTOMER_SESSION_COOKIE, hashPassword, publicCustomer, verifyPassword } from "../../../../lib/customer-auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid sign-in details." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 128) {
    return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
  }

  try {
    const profile = await prisma.customerProfile.findUnique({ where: { email } });
    const passwordMatches = profile
      ? await verifyPassword(password, profile.passwordHash)
      : (await hashPassword(password), false);
    if (!profile || !passwordMatches) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const session = await createCustomerSession(profile);
    const response = NextResponse.json({ session: { user: publicCustomer(profile) } });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, session.token, customerSessionCookieOptions);
    return response;
  } catch (error) {
    console.error("Could not sign in customer:", error);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
