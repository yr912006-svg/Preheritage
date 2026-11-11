import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { withAdminCapability } from "@/lib/admin-api-access";
import { adminAuditStore } from "@/lib/admin-audit";
import { createAdminReturnRequestHandlers } from "@/lib/admin-return-requests";

const handlers = createAdminReturnRequestHandlers({
  prisma,
  authorize: requireAdminCapability,
  auditStore: adminAuditStore,
  wrap: withAdminCapability,
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
