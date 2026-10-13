import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "An image ID is required." }, { status: 400 });

  try {
    const image = await prisma.productImage.findUnique({ where: { id } });
    if (!image) return NextResponse.json({ error: "Image was not found." }, { status: 404 });
    return new Response(image.data, {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not read product image:", error);
    return NextResponse.json({ error: "Could not load the product image." }, { status: 503 });
  }
}
