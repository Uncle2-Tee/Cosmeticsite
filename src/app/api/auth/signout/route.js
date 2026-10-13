import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { CUSTOMER_SESSION_COOKIE, customerSessionCookieOptions } from "../../../../lib/customer-auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (token) {
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await prisma.customerSession.deleteMany({ where: { tokenHash } });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, "", { ...customerSessionCookieOptions, maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Could not sign out customer:", error);
    return NextResponse.json({ error: "Could not sign out. Please try again." }, { status: 500 });
  }
}
