import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminCapability } from "@/lib/account-auth";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { adminAuditStore } from "@/lib/admin-audit";
import { getNeonFiles, storageObjectUrl } from "@/lib/neon-storage";
import { MAX_PRODUCT_IMAGE_BYTES, productImageExtension, validateProductImage } from "@/lib/product-image";

export const runtime = "nodejs";

const MAX_FILE_BYTES = MAX_PRODUCT_IMAGE_BYTES;
async function uploadProductImages(request: Request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files").length ? form.getAll("files") : [form.get("file")];
    if (!files.length || files.length > 12 || files.some((file) => !(file instanceof File))) {
      return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
    }
    for (const entry of files) {
      const file = entry as File;
      if (!productImageExtension(file.type)) return NextResponse.json({ error: "Use JPEG, PNG, or WebP images." }, { status: 415 });
      if (file.size === 0 || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Images must be smaller than 10 MB." }, { status: 413 });
    }
    const results = [];
    for (const entry of files) {
      const file = entry as File;
      const extension = productImageExtension(file.type)!;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const validationError = validateProductImage(file.type, file.size, bytes);
      if (validationError) return NextResponse.json({ error: validationError }, { status: 415 });
      const key = `products/${randomUUID()}.${extension}`;
      await getNeonFiles().upload(key, bytes, { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" });
      results.push({ key, url: storageObjectUrl(key) });
    }
    return NextResponse.json({ uploads: results, ...results[0] }, { status: 201 });
  } catch (error) {
    console.error("Neon object storage upload failed:", error);
    return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 503 });
  }
}

function createAdminStorageHandlers(authorize = requireAdminCapability) {
  return {
    POST: withAdminCapability(ADMIN_API_CAPABILITIES.productImageUpload.methods.POST, uploadProductImages, authorize, adminAuditStore),
  };
}

const handlers = createAdminStorageHandlers();
export const { POST } = handlers;
