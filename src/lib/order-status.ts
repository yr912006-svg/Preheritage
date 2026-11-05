export type OrderWorkflowStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

const NEXT_STATUSES: Record<OrderWorkflowStatus, readonly OrderWorkflowStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export function canTransitionOrderStatus(from: string, to: string): boolean {
  return Object.prototype.hasOwnProperty.call(NEXT_STATUSES, from) &&
    NEXT_STATUSES[from as OrderWorkflowStatus].includes(to as OrderWorkflowStatus);
}

// The admin order editor is not a refund processor. Refund status must only be
// set by a verified refund workflow that updates the payment/refund records too.
export function canAdminTransitionOrderStatus(from: string, to: string): boolean {
  return to !== "REFUNDED" && canTransitionOrderStatus(from, to);
}

const ADMIN_CANCELLABLE_PAYMENT_STATUSES = ["PENDING", "FAILED"] as const;

export function canAdminCancelOrder(status: string, paymentStatus: string): boolean {
  return canAdminTransitionOrderStatus(status, "CANCELLED") &&
    (ADMIN_CANCELLABLE_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus);
}
