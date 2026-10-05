import { NextResponse } from "next/server";
import { createServiceSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { productFromDatabaseRow } from "../../../lib/supabase/products";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "The shared product database is not configured." }, { status: 503 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("products").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ products: data.map(productFromDatabaseRow) });
  } catch (error) {
    console.error("Could not read the shared product catalogue:", error);
    return NextResponse.json({ error: "Could not load products from the database." }, { status: 503 });
  }
}
