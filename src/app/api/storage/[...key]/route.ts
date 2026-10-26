import { NextResponse } from "next/server";
import { getNeonFiles, isValidStorageKey } from "@/lib/neon-storage";

export const runtime = "nodejs";

type RouteContext = { params: { key: string[] } };

export async function GET(_request: Request, { params }: RouteContext) {
  const key = params.key.join("/");
  if (!isValidStorageKey(key)) {
    return NextResponse.json({ error: "Invalid object key." }, { status: 400 });
  }

  try {
    const file = await getNeonFiles().download(key);
    return new NextResponse(await file.arrayBuffer(), {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Neon Object Storage is not configured:")) {
      return NextResponse.json({ error: "Image storage is temporarily unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}
