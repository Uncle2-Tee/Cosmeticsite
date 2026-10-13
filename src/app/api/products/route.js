import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { productFromDatabaseRow } from "../../../lib/products";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ products: products.map(productFromDatabaseRow) });
  } catch (error) {
    console.error("Could not read the product catalogue:", error);
    return NextResponse.json({ error: "Could not load products from the PostgreSQL database." }, { status: 503 });
  }
}
