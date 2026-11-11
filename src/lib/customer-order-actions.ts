export const CUSTOMER_CANCELLABLE_STATUSES = ["PLACED", "CONFIRMED", "PACKED"] as const;
const CANCELLABLE_PAYMENT_STATUSES = ["PENDING", "FAILED"] as const;
const ACTIVE_RETURN_STATUSES = ["REQUESTED", "APPROVED", "ITEM_RECEIVED", "REFUND_INITIATED"] as const;

export function canCustomerCancelOrder(status: string, paymentStatus: string) {
  return (CUSTOMER_CANCELLABLE_STATUSES as readonly string[]).includes(status) &&
    (CANCELLABLE_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus);
}

export function encodeCustomerReturnRequest(input: { requestType: "RETURN" | "EXCHANGE"; itemIds: string[]; explanation?: string }) {
  return JSON.stringify({
    format: "preheritage-return-request-v1",
    requestType: input.requestType,
    orderItemIds: input.itemIds,
    customerExplanation: input.explanation?.trim() || null,
  });
}

export function decodeCustomerReturnRequest(explanation: string | null) {
  if (!explanation) return null;
  try {
    const value = JSON.parse(explanation);
    if (value?.format !== "preheritage-return-request-v1" || !["RETURN", "EXCHANGE"].includes(value.requestType) || !Array.isArray(value.orderItemIds)) return null;
    return { requestType: value.requestType as "RETURN" | "EXCHANGE", itemIds: value.orderItemIds.filter((id: unknown): id is string => typeof id === "string"), explanation: typeof value.customerExplanation === "string" ? value.customerExplanation : null };
  } catch { return null; }
}

export function createCustomerOrderActions(prisma: any, now: () => Date = () => new Date()) {
  return {
    async cancelOrder(userId: string | null | undefined, orderId: string) {
      if (!userId) return { status: "unauthorized" as const };
      const order = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true, status: true, paymentStatus: true, items: { select: { productId: true, variantId: true, quantity: true } } } });
      if (!order) return { status: "not-found" as const };
      if (!canCustomerCancelOrder(order.status, order.paymentStatus)) return { status: "ineligible" as const };

      const cancelled = await prisma.$transaction(async (tx: any) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, userId, status: order.status, paymentStatus: order.paymentStatus },
          data: { status: "CANCELLED", cancelledAt: now() },
        });
        if (updated.count !== 1) return null;

        for (const item of order.items) {
          const restocked = item.variantId
            ? await tx.productVariant.updateMany({ where: { id: item.variantId, productId: item.productId }, data: { stock: { increment: item.quantity } } })
            : await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          if (restocked.count !== 1) throw new Error("Could not restore cancelled order inventory.");
        }
        await tx.orderTimeline.create({ data: { orderId: order.id, status: "CANCELLED", title: "Order cancelled", description: "Cancelled by the customer before dispatch." } });
        return true;
      });
      return cancelled ? { status: "cancelled" as const } : { status: "conflict" as const };
    },

    async requestReturn(userId: string | null | undefined, orderId: string, input: unknown) {
      if (!userId) return { status: "unauthorized" as const };
      if (!input || typeof input !== "object" || Array.isArray(input)) return { status: "invalid" as const };
      const body = input as Record<string, unknown>;
      const requestType = body.requestType;
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      const explanation = typeof body.explanation === "string" ? body.explanation.trim() : "";
      const itemIds = Array.isArray(body.itemIds) ? body.itemIds : [];
      if ((requestType !== "RETURN" && requestType !== "EXCHANGE") || !reason || reason.length > 120 ||
          explanation.length > 1000 || itemIds.length < 1 || itemIds.length > 100 ||
          itemIds.some((id) => typeof id !== "string" || !id || id.length > 100) || new Set(itemIds).size !== itemIds.length) {
        return { status: "invalid" as const };
      }

      return prisma.$transaction(async (tx: any) => {
        // The order row serializes competing requests for this order. The lock
        // is held through eligibility, duplicate checking, and request insert.
        await tx.$queryRaw`SELECT "id" FROM "orders" WHERE "id" = ${orderId} AND "userId" = ${userId} FOR UPDATE`;
        const order = await tx.order.findFirst({ where: { id: orderId, userId }, select: { id: true, status: true, items: { select: { id: true } } } });
        if (!order) return { status: "not-found" as const };
        if (order.status !== "DELIVERED") return { status: "ineligible" as const };
        const ownedItems = new Set(order.items.map((item: { id: string }) => item.id));
        if (itemIds.some((id) => !ownedItems.has(id as string))) return { status: "invalid-items" as const };

        const existing = await tx.returnRequest.findFirst({ where: { orderId, userId, status: { in: [...ACTIVE_RETURN_STATUSES] } }, select: { id: true } });
        if (existing) return { status: "duplicate" as const };
        const request = await tx.returnRequest.create({ data: {
          orderId, userId, reason,
          explanation: encodeCustomerReturnRequest({ requestType, itemIds: itemIds as string[], explanation }),
        } });
        return { status: "created" as const, request };
      });
    },
  };
}
