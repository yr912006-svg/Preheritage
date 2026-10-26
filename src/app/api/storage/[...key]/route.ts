import { NextResponse } from "next/server";
import { isValidStorageKey, neonFiles } from "@/lib/neon-storage";

export const runtime = "nodejs";

type RouteContext = { params: { key: string[] } };

export async function GET(_request: Request, { params }: RouteContext) {
  const key = params.key.join("/");
  if (!isValidStorageKey(key)) {
    return NextResponse.json({ error: "Invalid object key." }, { status: 400 });
  }

  try {
    const file = await neonFiles.download(key);
    return new NextResponse(await file.arrayBuffer(), {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}
