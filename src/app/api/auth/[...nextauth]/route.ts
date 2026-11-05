import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export async function GET(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = context?.params ? await context.params : { nextauth: [] };
  return handler(req, { params });
}

export async function POST(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = context?.params ? await context.params : { nextauth: [] };
  return handler(req, { params });
}
