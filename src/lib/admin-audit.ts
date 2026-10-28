import prisma from "@/lib/prisma";
import type { AdminAuditStore } from "@/lib/admin-api-access";

/** Durable, minimal audit records for authorized administrative mutations. */
export const adminAuditStore: AdminAuditStore = {
  async begin(event) {
    const log = await prisma.adminActivityLog.create({
      data: { ...event, details: JSON.stringify({ outcome: "IN_PROGRESS" }) },
      select: { id: true },
    });
    return log.id;
  },
  async finish(id, outcome, status) {
    await prisma.adminActivityLog.update({
      where: { id },
      data: { details: JSON.stringify({ outcome, status }) },
    });
  },
};
