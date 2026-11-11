import type { Prisma, PrismaClient } from "@prisma/client";

type CustomerOrderHistoryInclude = {
  items: true,
  timeline: { orderBy: { createdAt: "asc" } },
  returnRequests: {
    where: { userId: string };
    orderBy: { createdAt: "desc" };
    select: { id: true; reason: true; explanation: true; status: true; createdAt: true };
  },
};

type CustomerOrderHistoryOrder = Prisma.OrderGetPayload<{ include: CustomerOrderHistoryInclude }>;

export async function loadCustomerOrderHistory(
  db: Pick<PrismaClient, "order">,
  userId: string,
): Promise<{ status: "loaded"; orders: CustomerOrderHistoryOrder[] } | { status: "unavailable" }> {
  try {
    const orders = await db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        timeline: { orderBy: { createdAt: "asc" } },
        returnRequests: {
          where: { userId }, orderBy: { createdAt: "desc" },
          select: { id: true, reason: true, explanation: true, status: true, createdAt: true },
        },
      } satisfies Prisma.OrderInclude,
    });
    return { status: "loaded", orders };
  } catch {
    return { status: "unavailable" };
  }
}
