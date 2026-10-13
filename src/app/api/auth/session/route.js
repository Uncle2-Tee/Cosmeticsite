import { NextResponse } from "next/server";
import { getAuthenticatedUser, sessionResponse } from "../../../../lib/customer-auth";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const profile = await getAuthenticatedUser(request);
    return NextResponse.json({ session: profile ? sessionResponse(profile) : null });
  } catch (error) {
    console.error("Could not load customer session:", error);
    return NextResponse.json({ error: "Could not check your sign-in session." }, { status: 500 });
  }
}
