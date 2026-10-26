import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { neonFiles, storageObjectUrl } from "@/lib/neon-storage";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const CONTENT_TYPES: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const token = await getToken({ req: request as never, secret: process.env.NEXTAUTH_SECRET });
  if (token?.role !== "ADMIN" || typeof token.adminRole !== "string") {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
    }
    const extension = CONTENT_TYPES[file.type];
    if (!extension) {
      return NextResponse.json({ error: "Use a JPEG, PNG, WebP, AVIF, or GIF image." }, { status: 415 });
    }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Images must be smaller than 10 MB." }, { status: 413 });
    }

    const key = `products/${randomUUID()}.${extension}`;
    await neonFiles.upload(key, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    });

    return NextResponse.json({ key, url: storageObjectUrl(key) }, { status: 201 });
  } catch (error) {
    console.error("Neon object storage upload failed:", error);
    return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 503 });
  }
}
