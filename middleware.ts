import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const authorized = isAdminRoute
    ? token?.role === "ADMIN" && typeof token.adminRole === "string"
    : token?.role === "CUSTOMER" && typeof token.id === "string";
  if (authorized) return NextResponse.next();
  const login = new URL(isAdminRoute ? "/admin/login" : "/login", request.url);
  login.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
