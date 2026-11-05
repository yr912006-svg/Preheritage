export async function persistOrderStatusTransition(tx: any, input: {
  orderId: string;
  expectedStatus: string;
  expectedPaymentStatus?: string;
  nextStatus: string;
  updateData: Record<string, unknown>;
  cancellationItems?: Array<{ productId: string; variantId: string | null; quantity: number }>;
}) {
  const isCancellation = input.nextStatus === "CANCELLED";
  if (isCancellation &&
      (!input.cancellationItems || !["PENDING", "FAILED"].includes(input.expectedPaymentStatus ?? ""))) {
    return null;
  }

  const result = await tx.order.updateMany({
    where: {
      id: input.orderId,
      status: input.expectedStatus,
      ...(isCancellation ? { paymentStatus: input.expectedPaymentStatus } : {}),
    },
    data: input.updateData,
  });
  if (result.count !== 1) return null;

  if (isCancellation) {
    for (const item of input.cancellationItems!) {
      const restocked = item.variantId
        ? await tx.productVariant.updateMany({ where: { id: item.variantId, productId: item.productId }, data: { stock: { increment: item.quantity } } })
        : await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      if (restocked.count !== 1) throw new Error("Could not restore cancelled order inventory.");
    }
  }

  const updated = await tx.order.findUnique({ where: { id: input.orderId } });
  if (!updated) throw new Error("Order disappeared after a successful status transition.");
  await tx.orderTimeline.create({ data: {
    orderId: input.orderId,
    status: input.nextStatus,
    title: `Order ${input.nextStatus.toLowerCase().replaceAll("_", " ")}`,
    description: "Order status updated by PREHERITAGE.",
  } });
  return updated;
}
