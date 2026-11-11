import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { AccountPageFrame, AccountUnavailable } from "@/components/account/AccountNav";
import { CustomerOrderActions } from "@/components/account/CustomerOrderActions";
import { CustomerOrderPurchaseActions } from "@/components/account/CustomerOrderPurchaseActions";
import { formatPrice, ORDER_TIMELINE_STEPS } from "@/lib/utils";
import { loadCustomerOrderHistory } from "@/lib/customer-order-history";

export default async function CustomerOrdersPage() {
  const user = await getCustomerUser();
  if (!user) redirect("/login?callbackUrl=%2Faccount%2Forders&reason=customer-required");
  const history = await loadCustomerOrderHistory(prisma, user.id);
  if (history.status !== "loaded") return <AccountUnavailable />;
  const { orders } = history;

  return (
    <AccountPageFrame active="/account/orders" title="Your Orders">
      {orders.length === 0 ? (
        <section className="rounded-xs border border-ivory-300 bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold-300 bg-gold-50/60 text-gold-700">
            <Package className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-700 block mb-1">
            Maison Order History
          </span>
          <h2 className="font-serif text-2xl font-medium text-charcoal-900 sm:text-3xl">
            Your Heirloom Collection Awaits
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-charcoal-600 font-light">
            You have not placed any orders yet. Every PREHERITAGE creation is hand-crafted by generational master artisans with luxury keepsake packaging and insured white-glove delivery.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center justify-center rounded-xs bg-charcoal-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 transition-colors hover:bg-gold-600"
            >
              Explore The Collection
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xs border border-charcoal-700 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-charcoal-900 transition-colors hover:border-gold-600 hover:text-gold-700"
            >
              Atelier Concierge
            </Link>
          </div>
          <div className="mt-8 border-t border-ivory-200 pt-6 text-[11px] text-charcoal-500 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span>✓ Complimentary Insured Delivery Across India</span>
            <span>✓ 7-Day Royal Exchange Guarantee</span>
            <span>✓ Certificate of Handloom Authenticity</span>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const orderAddress = order.shippingAddressSnapshot as Record<string, string> | null;
            const currentIndex = ORDER_TIMELINE_STEPS.findIndex((step) => step.status === order.status);
            return (
              <article key={order.id} className="overflow-hidden rounded-sm border border-ivory-300 bg-ivory-50 shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-200 bg-white px-5 py-4 text-xs">
                  <div>
                    <p className="font-semibold text-charcoal-900">Order {order.orderNumber}</p>
                    <p className="mt-1 text-charcoal-400">Placed {order.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-charcoal-900">{formatPrice(order.totalAmount)}</p>
                    <p className="mt-1 text-charcoal-500">{order.paymentMethod} · {order.paymentStatus}</p>
                  </div>
                </header>
                <div className="space-y-4 p-5">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} width={64} height={80} unoptimized={item.image.startsWith("/api/storage/")} className="h-20 w-16 rounded object-cover" />
                      ) : (
                        <div className="flex h-20 w-16 items-center justify-center rounded bg-ivory-200 font-serif text-gold-800">PH</div>
                      )}
                      <div className="flex-1 text-sm">
                        <p className="font-semibold text-charcoal-900">{item.title}</p>
                        <p className="mt-1 text-xs text-charcoal-400">{[item.size, item.color].filter(Boolean).join(" · ")} · Qty {item.quantity}</p>
                        <p className="mt-1 text-xs text-charcoal-600">{formatPrice(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-ivory-200 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">{order.status.replaceAll("_", " ")}</p>
                      {order.trackingUrl && order.trackingId ? (
                        <a className="text-xs font-semibold text-gold-800 underline" href={order.trackingUrl} target="_blank" rel="noreferrer">Track {order.trackingId}</a>
                      ) : order.trackingId ? (
                        <p className="text-xs text-charcoal-500">Tracking ID: {order.trackingId}</p>
                      ) : null}
                    </div>
                    <ol aria-label="Order progress" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
                      {ORDER_TIMELINE_STEPS.map((step, index) => (
                        <li key={step.status} className={`rounded px-2 py-2 text-[10px] ${index <= currentIndex ? "bg-gold-100 text-charcoal-900" : "bg-ivory-100 text-charcoal-300"}`}>
                          {step.label}
                        </li>
                      ))}
                    </ol>
                    {orderAddress && (
                      <p className="mt-4 text-xs text-charcoal-400">
                        Delivering to {orderAddress.fullName}, {orderAddress.city}, {orderAddress.state} {orderAddress.pincode}
                      </p>
                    )}
                    <CustomerOrderActions orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} items={order.items.map((item) => ({ id: item.id, title: item.title, quantity: item.quantity, size: item.size, color: item.color }))} requests={order.returnRequests} />
                    <CustomerOrderPurchaseActions orderNumber={order.orderNumber} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AccountPageFrame>
  );
}
