import { formatPrice } from "@/lib/utils";

export type OrderNotificationStatus = "PLACED" | "CONFIRMED" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

const EVENT_COPY: Record<OrderNotificationStatus, { subject: string; heading: string; message: string }> = {
  PLACED: { subject: "We received your PREHERITAGE order", heading: "Order received", message: "Your order has been placed. We will share updates as it moves through fulfillment." },
  CONFIRMED: { subject: "Your PREHERITAGE order is confirmed", heading: "Order confirmed", message: "Your order has been confirmed and is being prepared." },
  PACKED: { subject: "Your PREHERITAGE order is packed", heading: "Order packed", message: "Your order has been packed and is being prepared for dispatch." },
  SHIPPED: { subject: "Your PREHERITAGE order has shipped", heading: "Order shipped", message: "Your order has been handed to the courier." },
  OUT_FOR_DELIVERY: { subject: "Your PREHERITAGE order is out for delivery", heading: "Out for delivery", message: "Your courier is on the way with your order." },
  DELIVERED: { subject: "Your PREHERITAGE order was delivered", heading: "Order delivered", message: "Our records show that your order was delivered." },
  CANCELLED: { subject: "Your PREHERITAGE order was cancelled", heading: "Order cancelled", message: "Your order was cancelled. Contact customer care if you need assistance." },
};

export function selectOrderNotification(status: unknown) {
  if (typeof status !== "string" || !Object.hasOwn(EVENT_COPY, status)) return null;
  return { status: status as OrderNotificationStatus, ...EVENT_COPY[status as OrderNotificationStatus] };
}

export function buildOrderNotificationText(input: {
  orderNumber: string;
  totalAmount: number;
  status: OrderNotificationStatus;
  items: Array<{ title: string; quantity: number }>;
  trackingId?: string | null;
}) {
  const event = selectOrderNotification(input.status);
  if (!event) return null;
  const lines = input.items.slice(0, 50).map((item) => `- ${item.title} x ${item.quantity}`);
  return [
    `PREHERITAGE | ${event.heading}`,
    "",
    event.message,
    `Order: ${input.orderNumber}`,
    `Total: ${Number.isFinite(input.totalAmount) ? formatPrice(input.totalAmount) : "Unavailable"}`,
    ...(lines.length ? ["", "Items:", ...lines] : []),
    ...(input.status === "SHIPPED" && input.trackingId ? ["", `Tracking ID: ${input.trackingId}`] : []),
    "",
    "This is a service message about your order.",
  ].join("\n");
}

export async function sendOrderNotification(input: {
  prisma: any;
  orderId: string;
  expectedStatus: unknown;
  apiKey?: string;
  from?: string;
  fetcher?: typeof fetch;
}) {
  const event = selectOrderNotification(input.expectedStatus);
  if (!event) return { status: "unsupported-event" as const };
  if (!input.apiKey || !input.from) return { status: "not-configured" as const };

  const order = await input.prisma.order.findUnique({ where: { id: input.orderId }, select: {
    orderNumber: true, status: true, totalAmount: true, guestName: true, guestEmail: true,
    trackingId: true, userId: true,
    user: { select: { email: true, emailVerified: true } },
    items: { select: { title: true, quantity: true }, orderBy: { createdAt: "asc" }, take: 50 },
  } });
  if (!order || order.status !== event.status) return { status: "stale-event" as const };

  // Signed-in customers receive mail only at the verified account address.
  // Guest email is the contact address recorded with the order.
  const recipient = order.userId
    ? order.user?.emailVerified && typeof order.user.email === "string" ? order.user.email : null
    : typeof order.guestEmail === "string" ? order.guestEmail : null;
  if (!recipient || recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return { status: "no-recipient" as const };

  const text = buildOrderNotificationText({
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    status: event.status,
    items: order.items,
    trackingId: order.trackingId,
  });
  if (!text) return { status: "unsupported-event" as const };
  const fetcher = input.fetcher ?? fetch;
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: input.from, to: [recipient], subject: event.subject, text }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? { status: "accepted" as const } : { status: "failed" as const };
  } catch {
    return { status: "failed" as const };
  }
}

export async function sendPersistedOrderNotification(prisma: any, orderId: string, expectedStatus: unknown) {
  return sendOrderNotification({
    prisma,
    orderId,
    expectedStatus,
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL,
  });
}

export async function sendCommittedOrderNotification(
  prisma: any,
  transition: { id?: string; status?: string } | null,
  expectedStatus: unknown,
  options: { apiKey?: string; from?: string; fetcher?: typeof fetch } = {},
) {
  if (!transition?.id || transition.status !== expectedStatus) return { status: "not-committed" as const };
  return sendOrderNotification({
    prisma, orderId: transition.id, expectedStatus,
    apiKey: options.apiKey ?? process.env.RESEND_API_KEY,
    from: options.from ?? process.env.RESEND_FROM_EMAIL,
    fetcher: options.fetcher,
  });
}
