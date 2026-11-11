import { formatPrice } from "@/lib/utils";

export type InvoiceOrderInput = {
  orderNumber: string;
  invoiceNumber?: string | null;
  createdAt: Date | string;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  shippingAddressSnapshot?: unknown;
  items: Array<{ title?: string | null; sku?: string | null; size?: string | null; color?: string | null; quantity?: number | null; price?: number | null; totalPrice?: number | null }>;
  subtotal?: number | null;
  discountAmount?: number | null;
  shippingCharge?: number | null;
  giftWrap?: boolean | null;
  giftWrapCharge?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
};

const validText = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
const validAmount = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;

export function buildInvoiceHtml(order: InvoiceOrderInput) {
  const address = order.shippingAddressSnapshot && typeof order.shippingAddressSnapshot === "object" && !Array.isArray(order.shippingAddressSnapshot)
    ? order.shippingAddressSnapshot as Record<string, unknown>
    : {};
  const date = new Date(order.createdAt);
  const dateText = Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleDateString("en-IN", { dateStyle: "long" });
  const addressLines = [address.houseFlat, address.area, address.landmark, address.city, address.state, address.pincode, address.country]
    .map(validText).filter((value): value is string => Boolean(value));
  const rows = order.items.map((item) => {
    const descriptor = [validText(item.size), validText(item.color)].filter(Boolean).join(" / ");
    const quantity = Number.isInteger(item.quantity) && Number(item.quantity) > 0 ? Number(item.quantity) : null;
    const unitPrice = validAmount(item.price);
    const lineTotal = validAmount(item.totalPrice);
    return `<tr><td>${escapeHtml(validText(item.title) ?? "Unavailable")}${descriptor ? `<div class="muted">${escapeHtml(descriptor)}</div>` : ""}${validText(item.sku) ? `<div class="muted">SKU ${escapeHtml(item.sku)}</div>` : ""}</td><td>${quantity ?? "—"}</td><td>${unitPrice === null ? "Unavailable" : escapeHtml(formatPrice(unitPrice))}</td><td>${lineTotal === null ? "Unavailable" : escapeHtml(formatPrice(lineTotal))}</td></tr>`;
  }).join("");
  const total = (label: string, amount: unknown) => {
    const value = validAmount(amount);
    return value === null ? "" : `<div class="total-row"><span>${label}</span><strong>${escapeHtml(formatPrice(value))}</strong></div>`;
  };
  const optionalContact = [validText(order.guestEmail), validText(order.guestPhone)].filter(Boolean).map(escapeHtml).join(" · ");
  const customerName = validText(order.guestName) ?? validText(address.fullName);
  const grandTotal = validAmount(order.totalAmount);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Invoice ${escapeHtml(order.orderNumber)}</title><style>body{font:15px Arial,sans-serif;color:#25221d;margin:0;padding:32px}.invoice{max-width:850px;margin:auto}.top{display:flex;justify-content:space-between;border-bottom:2px solid #c5a869;padding-bottom:18px}.muted{color:#716d66;font-size:12px;margin-top:4px}h1{font-family:Georgia,serif;margin:0 0 8px}h2{font-size:14px;margin:26px 0 8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #e6e0d5}th{font-size:11px;text-transform:uppercase;color:#716d66}.totals{max-width:320px;margin:18px 0 0 auto}.total-row{display:flex;justify-content:space-between;padding:5px 0}.grand{font-size:18px;border-top:1px solid #a99b7a;margin-top:8px;padding-top:12px}@media print{body{padding:0}.invoice{max-width:none}}</style></head><body><main class="invoice"><header class="top"><div><h1>PREHERITAGE</h1><div class="muted">Order invoice</div></div><div><strong>Order ${escapeHtml(order.orderNumber)}</strong><div class="muted">Placed ${escapeHtml(dateText)}</div>${validText(order.invoiceNumber) ? `<div class="muted">Invoice ${escapeHtml(order.invoiceNumber)}</div>` : ""}</div></header><section><h2>Customer</h2><div>${escapeHtml(customerName ?? "Unavailable")}</div>${optionalContact ? `<div class="muted">${optionalContact}</div>` : ""}<h2>Shipping address</h2>${addressLines.length ? addressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("") : `<div class="muted">Not recorded</div>`}</section><table><thead><tr><th>Product / variant</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead><tbody>${rows || `<tr><td colspan="4">Item details unavailable</td></tr>`}</tbody></table><section class="totals">${total("Subtotal", order.subtotal)}${total("Discount", order.discountAmount)}${total("Shipping", order.shippingCharge)}${order.giftWrap ? total("Gift wrap", order.giftWrapCharge) : ""}${total("Tax", order.taxAmount)}<div class="total-row grand"><span>Final total</span><strong>${grandTotal === null ? "Unavailable" : escapeHtml(formatPrice(grandTotal))}</strong></div></section><p class="muted">Payment: ${escapeHtml(validText(order.paymentMethod) ?? "Unavailable")} · ${escapeHtml(validText(order.paymentStatus) ?? "Unavailable")}</p></main></body></html>`;
}

export async function loadOwnedInvoiceOrder(db: any, userId: string | null | undefined, orderNumber: string) {
  if (!userId) return { status: "unauthorized" as const };
  const order = await db.order.findFirst({ where: { orderNumber, userId }, select: {
    orderNumber: true, invoiceNumber: true, createdAt: true, guestName: true, guestEmail: true, guestPhone: true,
    shippingAddressSnapshot: true, subtotal: true, discountAmount: true, shippingCharge: true, giftWrap: true, giftWrapCharge: true, taxAmount: true,
    totalAmount: true, paymentMethod: true, paymentStatus: true,
    items: { select: { title: true, sku: true, size: true, color: true, quantity: true, price: true, totalPrice: true }, orderBy: { createdAt: "asc" } },
  } });
  return order ? { status: "found" as const, order } : { status: "not-found" as const };
}
