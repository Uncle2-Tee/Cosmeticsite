import { NextResponse } from "next/server";
import { getAuthenticatedUser, createServiceSupabaseClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { productFromDatabaseRow } from "../../../../lib/supabase/products";

export const runtime = "nodejs";

function validStoreData(cart, wishlist) {
  return Array.isArray(cart)
    && cart.length <= 20
    && cart.every((item) => item && typeof item.productId === "string" && item.productId.trim()
      && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 20)
    && new Set(cart.map((item) => item.productId)).size === cart.length
    && Array.isArray(wishlist)
    && wishlist.length <= 100
    && wishlist.every((productId) => typeof productId === "string" && productId.trim())
    && new Set(wishlist).size === wishlist.length;
}

function getStoreData(user) {
  const store = user.user_metadata?.customer_store;
  if (!store) return { cart: [], wishlist: [] };
  if (!validStoreData(store.cart, store.wishlist)) {
    throw new Error("The saved customer cart or wishlist has an invalid format.");
  }
  return store;
}

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to load your saved cart and wishlist." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "The customer store database is not configured." }, { status: 503 });

  try {
    const { cart, wishlist } = getStoreData(user);
    const productIds = cart.map((item) => item.productId);
    const supabase = createServiceSupabaseClient();
    const { data: productRows, error } = productIds.length
      ? await supabase.from("products").select("*").in("id", productIds)
      : { data: [], error: null };
    if (error) throw error;

    const products = new Map(productRows.map((row) => [row.id, productFromDatabaseRow(row)]));
    return NextResponse.json({
      cart: cart.flatMap((item) => {
        const product = products.get(item.productId);
        return product ? [{ ...product, quantity: item.quantity }] : [];
      }),
      wishlist,
    });
  } catch (error) {
    console.error("Could not load customer cart and wishlist:", error);
    return NextResponse.json({ error: "Could not load your saved cart and wishlist." }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to save your cart and wishlist." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "The customer store database is not configured." }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid customer store data." }, { status: 400 });
  }

  const { cart, wishlist } = body || {};
  if (!validStoreData(cart, wishlist)) {
    return NextResponse.json({ error: "Provide valid cart and wishlist items." }, { status: 400 });
  }

  try {
    const productIds = [...new Set([...cart.map((item) => item.productId), ...wishlist])];
    if (productIds.length) {
      const supabase = createServiceSupabaseClient();
      const { data: products, error } = await supabase.from("products").select("id").in("id", productIds);
      if (error) throw error;
      const availableIds = new Set(products.map((product) => product.id));
      if (productIds.some((id) => !availableIds.has(id))) {
        return NextResponse.json({ error: "One or more saved products are no longer available." }, { status: 409 });
      }
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        customer_store: { cart, wishlist },
      },
    });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Could not save customer cart and wishlist:", error);
    return NextResponse.json({ error: "Could not save your cart and wishlist." }, { status: 500 });
  }
}
