import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, hasValidAdminSession } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

async function requireAdmin() {
  const cookieStore = await cookies();
  return hasValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function POST(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No image file was provided." }, { status: 400 });
    }
    if (!supportedImageTypes.has(file.type)) {
      return NextResponse.json({ error: "Use a JPEG, PNG, WebP, AVIF, or GIF image." }, { status: 400 });
    }
    if (file.size < 1 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image file must be smaller than 5 MB." }, { status: 400 });
    }

    const id = randomUUID();
    const filename = file.name.replace(/[^a-z0-9.-]/gi, "-").toLowerCase().slice(0, 180) || "product-image";
    await prisma.productImage.create({
      data: {
        id,
        filename,
        mimeType: file.type,
        data: Buffer.from(await file.arrayBuffer()),
      },
    });
    return NextResponse.json({ url: `/api/product-images?id=${id}` });
  } catch (error) {
    console.error("Could not save product image:", error);
    return NextResponse.json({ error: "Could not save the product image to the database." }, { status: 500 });
  }
}
