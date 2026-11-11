import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export async function GET(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  try {
    if (!("nextUrl" in req) || !(req as any).nextUrl) {
      (req as any).nextUrl = new URL(req.url);
    }
    const params = context?.params ? await context.params : { nextauth: [] };
    return await handler(req, { params });
  } catch (error) {
    console.error("[NextAuth GET /api/auth/[...nextauth]] Error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication service error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  try {
    if (!("nextUrl" in req) || !(req as any).nextUrl) {
      (req as any).nextUrl = new URL(req.url);
    }
    const params = context?.params ? await context.params : { nextauth: [] };
    return await handler(req, { params });
  } catch (error) {
    console.error("[NextAuth POST /api/auth/[...nextauth]] Error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication service error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
