import { NextResponse } from "next/server";
import { getAuthenticatedUser, createServiceSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to view your orders." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "The order database is not configured." }, { status: 503 });
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ orders: data });
  } catch (error) {
    console.error("Could not load customer orders:", error);
    return NextResponse.json({ error: "Could not load your orders." }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in before placing an order." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "The order database is not configured." }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid order details." }, { status: 400 });
  }
  const { items, phone, shippingAddress } = body || {};
  if (!Array.isArray(items) || items.length < 1 || items.length > 20
    || items.some((item) => !item || typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)
    || typeof phone !== "string" || phone.trim().length < 7 || phone.trim().length > 30
    || typeof shippingAddress !== "string" || shippingAddress.trim().length < 8 || shippingAddress.trim().length > 500) {
    return NextResponse.json({ error: "Provide valid cart items, a phone number, and a delivery address." }, { status: 400 });
  }
  const email = user.email;
  const customerName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  if (!email || !customerName || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Add your name and verify your email before placing an order." }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const productIds = [...new Set(items.map((item) => item.productId))];
    const { data: products, error: productError } = await supabase.from("products").select("id,name,price,image,size,category").in("id", productIds);
    if (productError) throw productError;
    const byId = new Map(products.map((product) => [product.id, product]));
    if (productIds.some((id) => !byId.has(id))) {
      return NextResponse.json({ error: "One or more cart products are no longer available. Refresh your cart and try again." }, { status: 409 });
    }

    const orderItems = items.map(({ productId, quantity }) => {
      const product = byId.get(productId);
      return {
        product_id: product.id,
        name: product.name,
        category: product.category,
        size: product.size,
        image: product.image,
        price: Number(product.price),
        quantity,
        line_total: Number((Number(product.price) * quantity).toFixed(2)),
      };
    });
    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2));
    const shipping = subtotal >= 60 ? 0 : 6;
    const order = {
      user_id: user.id,
      status: "awaiting_payment",
      payment_method: "momo",
      items: orderItems,
      subtotal,
      shipping,
      total: Number((subtotal + shipping).toFixed(2)),
      customer_name: customerName,
      customer_email: email,
      phone: phone.trim(),
      shipping_address: shippingAddress.trim(),
    };
    const { data, error } = await supabase.from("orders").insert(order).select("*").single();
    if (error) throw error;
    return NextResponse.json({ order: data }, { status: 201 });
  } catch (error) {
    console.error("Could not create customer order:", error);
    return NextResponse.json({ error: "Could not save your order. Please try again." }, { status: 500 });
  }
}
