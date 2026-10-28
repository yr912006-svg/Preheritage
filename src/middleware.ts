import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { customerRouteAccess, type CustomerRouteToken } from "@/lib/customer-route-access";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAdminRoute = pathname.startsWith("/admin");

  const requestedPath = `${pathname}${request.nextUrl.search}`;
  if (!token || typeof token.id !== "string") {
    const login = new URL(isAdminRoute ? "/admin/login" : "/login", request.url);
    login.searchParams.set("callbackUrl", isAdminRoute ? pathname : customerRouteAccess(null, requestedPath).callbackUrl);
    return NextResponse.redirect(login);
  }

  if (isAdminRoute) {
    if (token.role !== "ADMIN") {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    // The protected admin layout verifies the active Admin record in the
    // database. Do not require a second, potentially stale adminRole JWT claim.
    return NextResponse.next();
  }

  const customerAccess = customerRouteAccess(token as unknown as CustomerRouteToken, requestedPath);
  if (!customerAccess.allow) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", customerAccess.callbackUrl);
    if (customerAccess.reason) login.searchParams.set("reason", customerAccess.reason);
    return NextResponse.redirect(login);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-preheritage-account-path", customerAccess.callbackUrl);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
