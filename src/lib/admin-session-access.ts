export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "PRODUCT_MANAGER",
  "ORDER_MANAGER",
  "CONTENT_MANAGER",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_CAPABILITIES = [
  "analytics.sales.read",
  "products.read",
  "products.manage",
  "inventory.read",
  "inventory.manage",
  "product-images.upload",
  "orders.read",
  "orders.manage",
  "customers.directory.read",
  "returns.manage",
  "refunds.execute",
  "coupons.manage",
  "reviews.moderate",
  "inquiries.general.manage",
  "inquiries.order.manage",
  "admin-accounts.manage",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

const ROLE_CAPABILITIES: Record<AdminRole, ReadonlySet<AdminCapability>> = {
  SUPER_ADMIN: new Set<AdminCapability>(ADMIN_CAPABILITIES),
  PRODUCT_MANAGER: new Set<AdminCapability>([
    "products.read",
    "products.manage",
    "inventory.read",
    "inventory.manage",
    "product-images.upload",
  ]),
  ORDER_MANAGER: new Set<AdminCapability>([
    "analytics.sales.read",
    "orders.read",
    "orders.manage",
    "returns.manage",
    "coupons.manage",
    "inquiries.order.manage",
  ]),
  CONTENT_MANAGER: new Set<AdminCapability>([
    "reviews.moderate",
    "inquiries.general.manage",
  ]),
};

export type AdminSessionIdentity = { id?: string | null } | null | undefined;
export type ActiveAdminRecord = { id: string; role: string; isActive: boolean };
export type AdminAccessStatus = 200 | 401 | 403;

export function hasAdminSession(identity: AdminSessionIdentity): boolean {
  return Boolean(identity?.id);
}

export function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function isAdminCapability(capability: string): capability is AdminCapability {
  return (ADMIN_CAPABILITIES as readonly string[]).includes(capability);
}

export function adminRoleCan(role: string, capability: string): boolean {
  if (!isAdminRole(role) || !isAdminCapability(capability)) return false;
  return ROLE_CAPABILITIES[role].has(capability);
}

/** Resolves access using the authenticated identity and the current database row. */
export function adminCapabilityStatus(
  identity: AdminSessionIdentity,
  admin: ActiveAdminRecord | null | undefined,
  capability: string,
): AdminAccessStatus {
  if (!hasAdminSession(identity)) return 401;
  if (!admin || !admin.isActive || admin.id !== identity?.id) return 403;
  return adminRoleCan(admin.role, capability) ? 200 : 403;
}
