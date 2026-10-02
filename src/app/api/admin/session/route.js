import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionOptions,
  createAdminSession,
  isAdminAuthConfigured,
  passwordMatches,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: "Admin access has not been configured." }, { status: 503 });
  }

  let password = "";
  try {
    ({ password = "" } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof password !== "string" || !passwordMatches(password)) {
    return NextResponse.json({ error: "That password is not recognized." }, { status: 401 });
  }

  const session = createAdminSession();
  if (!session) return NextResponse.json({ error: "Admin access has not been configured." }, { status: 503 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, session.value, adminSessionOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminSessionOptions, maxAge: 0 });
  return response;
}
