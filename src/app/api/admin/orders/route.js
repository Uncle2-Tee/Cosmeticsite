import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, hasValidAdminSession } from "../../../../lib/admin-auth";
import { createServiceSupabaseClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

const orderStatuses = new Set(["awaiting_payment", "payment_review", "processing", "shipped", "delivered", "cancelled"]);

async function requireAdmin() {
  const cookieStore = await cookies();
  return hasValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase database credentials are not configured on the server." }, { status: 503 });
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ orders: data });
  } catch (error) {
    console.error("Admin could not load customer orders:", error);
    return NextResponse.json({ error: "Could not load orders from the database." }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase database credentials are not configured on the server." }, { status: 503 });

  let orderId;
  let status;
  try {
    ({ orderId, status } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid order update." }, { status: 400 });
  }
  if (typeof orderId !== "string" || !orderId || !orderStatuses.has(status)) {
    return NextResponse.json({ error: "Provide a valid order and status." }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", orderId).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Order was not found." }, { status: 404 });
    return NextResponse.json({ order: data });
  } catch (error) {
    console.error("Admin could not update customer order:", error);
    return NextResponse.json({ error: "Could not update the order status." }, { status: 500 });
  }
}
