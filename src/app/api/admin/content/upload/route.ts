import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminCapability } from "@/lib/account-auth";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { adminAuditStore } from "@/lib/admin-audit";
import { getNeonFiles, storageObjectUrl } from "@/lib/neon-storage";
import { MAX_PRODUCT_IMAGE_BYTES, productImageExtension, validateProductImage } from "@/lib/product-image";

export const runtime = "nodejs";

async function uploadContentImage(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ message: "Choose an image file to upload." }, { status: 400 });
    const extension = productImageExtension(file.type);
    if (!extension) return NextResponse.json({ message: "Use JPEG, PNG, WebP, or AVIF images." }, { status: 415 });
    if (file.size === 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) return NextResponse.json({ message: "Images must be smaller than 10 MB." }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validationError = validateProductImage(file.type, file.size, bytes);
    if (validationError) return NextResponse.json({ message: validationError }, { status: 415 });
    const key = `products/content/${randomUUID()}.${extension}`;
    await getNeonFiles().upload(key, bytes, { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" });
    return NextResponse.json({ url: storageObjectUrl(key) }, { status: 201 });
  } catch (error) {
    console.error("Admin content image upload failed:", error);
    return NextResponse.json({ message: "Image upload failed. Check object storage configuration and try again." }, { status: 503 });
  }
}

export const POST = withAdminCapability(ADMIN_API_CAPABILITIES.content.methods.PATCH, uploadContentImage, requireAdminCapability, adminAuditStore);
