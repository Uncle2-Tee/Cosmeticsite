import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, hasValidAdminSession } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const orderStatuses = new Set(["awaiting_payment", "payment_review", "processing", "shipped", "delivered", "cancelled"]);

async function requireAdmin() {
  const cookieStore = await cookies();
  return hasValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

function orderToApi(order) {
  return {
    id: order.id,
    user_id: order.userId,
    status: order.status,
    payment_method: order.paymentMethod,
    items: order.items,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    total: Number(order.total),
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    phone: order.phone,
    shipping_address: order.shippingAddress,
    created_at: order.createdAt.toISOString(),
  };
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ orders: orders.map(orderToApi) });
  } catch (error) {
    console.error("Admin could not load customer orders:", error);
    return NextResponse.json({ error: "Could not load orders from the database." }, { status: 503 });
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
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
    const order = await prisma.order.update({ where: { id: orderId }, data: { status } });
    return NextResponse.json({ order: orderToApi(order) });
  } catch (error) {
    if (error.code === "P2025") return NextResponse.json({ error: "Order was not found." }, { status: 404 });
    console.error("Admin could not update customer order:", error);
    return NextResponse.json({ error: "Could not update the order status." }, { status: 500 });
  }
}
