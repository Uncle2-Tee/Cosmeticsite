import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, hasValidAdminSession } from "../../../../lib/admin-auth";
import { createServiceSupabaseClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { productFromDatabaseRow, productToDatabaseRow, validProduct } from "../../../../lib/supabase/products";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  return hasValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

function databaseUnavailable() {
  return NextResponse.json({ error: "Supabase database credentials are not configured on the server." }, { status: 503 });
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!isSupabaseConfigured()) return databaseUnavailable();
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("products").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ products: data.map(productFromDatabaseRow) });
  } catch (error) {
    console.error("Admin could not read product catalogue:", error);
    return NextResponse.json({ error: "Could not load products from the database." }, { status: 503 });
  }
}

export async function POST(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!isSupabaseConfigured()) return databaseUnavailable();
  let product;
  try {
    ({ product } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
  }
  if (!validProduct(product)) return NextResponse.json({ error: "Complete all required product fields with a valid price." }, { status: 400 });

  try {
    const supabase = createServiceSupabaseClient();
    const { data: first, error: firstError } = await supabase.from("products").select("sort_order").order("sort_order", { ascending: true }).limit(1).maybeSingle();
    if (firstError) throw firstError;
    const row = productToDatabaseRow({ ...product, sortOrder: (first?.sort_order ?? 0) - 1 });
    const { data, error } = await supabase.from("products").insert(row).select("*").single();
    if (error) throw error;
    return NextResponse.json({ product: productFromDatabaseRow(data) }, { status: 201 });
  } catch (error) {
    console.error("Admin could not create product:", error);
    return NextResponse.json({ error: "Could not save the product to the database." }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!isSupabaseConfigured()) return databaseUnavailable();
  let id;
  let changes;
  try {
    ({ id, ...changes } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid product update." }, { status: 400 });
  }
  if (typeof id !== "string" || !id || Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "A product and at least one change are required." }, { status: 400 });
  }
  const update = { updated_at: new Date().toISOString() };
  if (Object.hasOwn(changes, "price")) {
    const price = Number(changes.price);
    if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "Price must be greater than zero." }, { status: 400 });
    update.price = price;
  }
  if (Object.hasOwn(changes, "cardDescription")) {
    if (typeof changes.cardDescription !== "string") return NextResponse.json({ error: "The featured description must be text." }, { status: 400 });
    update.card_description = changes.cardDescription;
  }
  if (Object.keys(changes).some((key) => key !== "price" && key !== "cardDescription")) {
    return NextResponse.json({ error: "Unsupported product fields." }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("products").update(update).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Product was not found." }, { status: 404 });
    return NextResponse.json({ product: productFromDatabaseRow(data) });
  } catch (error) {
    console.error("Admin could not update product:", error);
    return NextResponse.json({ error: "Could not update the product in the database." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!isSupabaseConfigured()) return databaseUnavailable();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A product ID is required." }, { status: 400 });
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("products").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Product was not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin could not remove product:", error);
    return NextResponse.json({ error: "Could not remove the product from the database." }, { status: 500 });
  }
}
