import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/account-auth";
import { getNeonFiles, storageObjectUrl } from "@/lib/neon-storage";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const access = await requireAdminUser();
    if (!access.admin) return NextResponse.json({ error: access.status === 401 ? "Authentication required." : "Admin access required." }, { status: access.status });
    const form = await request.formData();
    const files = form.getAll("files").length ? form.getAll("files") : [form.get("file")];
    if (!files.length || files.length > 12 || files.some((file) => !(file instanceof File))) {
      return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
    }
    for (const entry of files) {
      const file = entry as File;
      if (!CONTENT_TYPES[file.type]) return NextResponse.json({ error: "Use JPEG, PNG, or WebP images." }, { status: 415 });
      if (file.size === 0 || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Images must be smaller than 10 MB." }, { status: 413 });
    }
    const results = [];
    for (const entry of files) {
      const file = entry as File;
      const extension = CONTENT_TYPES[file.type];
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!hasValidImageSignature(file.type, bytes)) return NextResponse.json({ error: "The selected file does not contain a valid JPEG, PNG, or WebP image." }, { status: 415 });
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

function hasValidImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (type === "image/webp") return bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}
