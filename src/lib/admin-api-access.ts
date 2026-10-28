import type { AdminCapability } from "@/lib/admin-session-access";

export const ADMIN_API_CAPABILITIES = {
  products: {
    path: "/api/admin/products",
    methods: { GET: "products.read", POST: "products.manage", PATCH: "products.manage", DELETE: "products.manage" },
  },
  catalogTaxonomy: {
    path: "/api/admin/catalog-taxonomy",
    methods: { GET: "products.read", POST: "products.manage", PATCH: "products.manage", DELETE: "products.manage" },
  },
  inventory: {
    path: "/api/admin/inventory",
    methods: { GET: "inventory.read", PATCH: "inventory.manage" },
  },
  orders: {
    path: "/api/admin/orders",
    methods: { GET: "orders.read", PATCH: "orders.manage" },
  },
  generalInquiries: {
    path: "/api/admin/inquiries",
    methods: {
      GET: "inquiries.general.manage",
      PATCH: "inquiries.general.manage",
      DELETE: "inquiries.general.manage",
    },
  },
  productImageUpload: {
    path: "/api/storage/upload",
    methods: { POST: "product-images.upload" },
  },
} as const satisfies Record<string, { path: string; methods: Record<string, AdminCapability> }>;

export type AdminCapabilityAuthorizer = (capability: AdminCapability) => Promise<{
  admin: unknown | null;
  status: 200 | 401 | 403 | 503;
}>;

type AuditActor = { id: string };
type AuditEvent = { adminId: string; action: string; target: string };
export type AdminAuditStore = {
  begin: (event: AuditEvent) => Promise<string>;
  finish: (id: string, outcome: "SUCCESS" | "FAILURE", status: number) => Promise<void>;
};

const AUDIT_TARGET_FIELDS = ["productId", "orderId", "ticketId", "id", "variantId"] as const;

async function auditTarget(request: Request) {
  let target = new URL(request.url).pathname;
  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = await request.clone().json();
      for (const key of AUDIT_TARGET_FIELDS) {
        const value = body?.[key];
        if (typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value)) {
          target += `#${value}`;
          break;
        }
      }
    } catch {
      // The route handler owns malformed-body responses; audit only its route.
    }
  }
  return target;
}

export function withAdminCapability<TArgs extends [Request, ...unknown[]]>(
  capability: AdminCapability,
  handler: (...args: TArgs) => Promise<Response>,
  authorize: AdminCapabilityAuthorizer,
  auditStore?: AdminAuditStore,
) {
  return async (...args: TArgs): Promise<Response> => {
    let access: Awaited<ReturnType<AdminCapabilityAuthorizer>>;
    try {
      access = await authorize(capability);
    } catch {
      return Response.json({ message: "Administrator authorization is temporarily unavailable." }, { status: 503 });
    }
    if (!access.admin) {
      const message = access.status === 401
        ? "Authentication required."
        : access.status === 503
          ? "Administrator authorization is temporarily unavailable."
          : "Administrator permission required.";
      return Response.json({ message }, { status: access.status });
    }
    const request = args[0];
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) {
      if (!auditStore) {
        return Response.json({ message: "Administrative audit logging is temporarily unavailable." }, { status: 503 });
      }
      const actor = access.admin as AuditActor;
      let auditId: string;
      try {
        auditId = await auditStore.begin({
          adminId: actor.id,
          action: `${request.method.toUpperCase()} ${new URL(request.url).pathname} (${capability})`,
          target: await auditTarget(request),
        });
      } catch {
        return Response.json({ message: "Administrative audit logging is temporarily unavailable." }, { status: 503 });
      }

      try {
        const response = await handler(...args);
        try { await auditStore.finish(auditId, response.status < 400 ? "SUCCESS" : "FAILURE", response.status); }
        catch { console.error("Could not finalize an administrative audit record."); }
        return response;
      } catch (error) {
        try { await auditStore.finish(auditId, "FAILURE", 500); }
        catch { console.error("Could not finalize an administrative audit record."); }
        throw error;
      }
    }
    return handler(...args);
  };
}
