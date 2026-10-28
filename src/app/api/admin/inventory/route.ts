import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { adminAuditStore } from "@/lib/admin-audit";
import { createAdminInventoryHandlers } from "@/lib/admin-inventory-handlers";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { getSellableStock } from "@/lib/inventory";

const handlers = createAdminInventoryHandlers({
  prisma,
  authorize: requireAdminCapability,
  auditStore: adminAuditStore,
  wrap: withAdminCapability,
  readCapability: ADMIN_API_CAPABILITIES.inventory.methods.GET,
  mutationCapability: ADMIN_API_CAPABILITIES.inventory.methods.PATCH,
  getSellableStock,
});

export const { GET, PATCH } = handlers;
