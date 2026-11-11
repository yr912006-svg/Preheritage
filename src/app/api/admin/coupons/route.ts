import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { adminAuditStore } from "@/lib/admin-audit";
import { withAdminCapability } from "@/lib/admin-api-access";
import { createAdminCouponHandlers } from "@/lib/coupon-admin";

const handlers = createAdminCouponHandlers({
  prisma,
  authorize: requireAdminCapability,
  auditStore: adminAuditStore,
  wrap: withAdminCapability,
});

export const { GET, POST, PATCH } = handlers;
