import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionOptions,
  createAdminSession,
  isAdminAuthConfigured,
  credentialsMatch,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: "Admin access has not been configured." }, { status: 503 });
  }

  let username = "";
  let password = "";
  try {
    ({ username = "", password = "" } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    if (!(await credentialsMatch(username, password))) {
      return NextResponse.json({ error: "That username or password is not recognized." }, { status: 401 });
    }

    const session = await createAdminSession();
    if (!session) return NextResponse.json({ error: "Admin access has not been configured." }, { status: 503 });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, session.value, adminSessionOptions);
    return response;
  } catch (error) {
    console.error("Could not verify admin credentials:", error);
    return NextResponse.json({ error: "Admin sign-in is temporarily unavailable." }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminSessionOptions, maxAge: 0 });
  return response;
}
