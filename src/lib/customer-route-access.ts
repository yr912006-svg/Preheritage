export interface CustomerRouteToken {
  id?: unknown;
  role?: unknown;
  adminRole?: unknown;
}

export function safeAccountReturnPath(value: string | null | undefined): string {
  if (!value) return "/account";
  try {
    const base = "http://preheritage.local";
    const target = new URL(value, base);
    if (target.origin !== base || (target.pathname !== "/account" && !target.pathname.startsWith("/account/"))) {
      return "/account";
    }
    return `${target.pathname}${target.search}`;
  } catch {
    return "/account";
  }
}

export function disabledOtpLoginRedirect(callbackUrl: string | null | undefined): string {
  const safeCallbackUrl = safeAccountReturnPath(callbackUrl);
  return `/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;
}

export function customerRouteAccess(token: CustomerRouteToken | null, returnPath: string) {
  const callbackUrl = safeAccountReturnPath(returnPath);
  if (!token || typeof token.id !== "string" || !token.id) {
    return { allow: false as const, callbackUrl, reason: null };
  }
  if (token.role !== "CUSTOMER" || token.adminRole) {
    return { allow: false as const, callbackUrl, reason: "customer-required" as const };
  }
  return { allow: true as const, callbackUrl };
}
