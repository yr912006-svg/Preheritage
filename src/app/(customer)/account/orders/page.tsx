import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { AccountPageFrame } from "@/components/account/AccountNav";
import { formatPrice, ORDER_TIMELINE_STEPS } from "@/lib/utils";

export default async function CustomerOrdersPage() {
  const user = await getCustomerUser();
  if (!user) redirect("/login?callbackUrl=%2Faccount%2Forders&reason=customer-required");
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true, timeline: { orderBy: { createdAt: "asc" } } } });

  return <AccountPageFrame active="/account/orders" title="Your Orders">
    {orders.length === 0 ? <section className="rounded-sm border border-ivory-300 bg-ivory-50 p-10 text-center"><h2 className="font-serif text-xl font-semibold text-charcoal-900">No orders yet</h2><p className="mt-2 text-sm text-charcoal-400">Your confirmed purchases will appear here.</p><Link href="/shop" className="mt-5 inline-flex rounded bg-charcoal-900 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white">Explore the collection</Link></section> :
      <div className="space-y-5">{orders.map((order) => {
        const orderAddress = order.shippingAddressSnapshot as Record<string, string> | null;
        const currentIndex = ORDER_TIMELINE_STEPS.findIndex((step) => step.status === order.status);
        return <article key={order.id} className="overflow-hidden rounded-sm border border-ivory-300 bg-ivory-50 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-200 bg-white px-5 py-4 text-xs"><div><p className="font-semibold text-charcoal-900">Order {order.orderNumber}</p><p className="mt-1 text-charcoal-400">Placed {order.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</p></div><div className="text-right"><p className="font-bold text-charcoal-900">{formatPrice(order.totalAmount)}</p><p className="mt-1 text-charcoal-500">{order.paymentMethod} · {order.paymentStatus}</p></div></header>
          <div className="space-y-4 p-5">{order.items.map((item) => <div key={item.id} className="flex gap-4">{item.image ? <Image src={item.image} alt={item.title} width={64} height={80} unoptimized={item.image.startsWith("/api/storage/")} className="h-20 w-16 rounded object-cover" /> : <div className="flex h-20 w-16 items-center justify-center rounded bg-ivory-200 font-serif text-gold-800">PH</div>}<div className="flex-1 text-sm"><p className="font-semibold text-charcoal-900">{item.title}</p><p className="mt-1 text-xs text-charcoal-400">{[item.size, item.color].filter(Boolean).join(" · ")} · Qty {item.quantity}</p><p className="mt-1 text-xs text-charcoal-600">{formatPrice(item.totalPrice)}</p></div></div>)}
            <div className="border-t border-ivory-200 pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">{order.status.replaceAll("_", " ")}</p>{order.trackingUrl && order.trackingId ? <a className="text-xs font-semibold text-gold-800 underline" href={order.trackingUrl} target="_blank" rel="noreferrer">Track {order.trackingId}</a> : order.trackingId ? <p className="text-xs text-charcoal-500">Tracking ID: {order.trackingId}</p> : null}</div>
              <ol aria-label="Order progress" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6">{ORDER_TIMELINE_STEPS.map((step, index) => <li key={step.status} className={`rounded px-2 py-2 text-[10px] ${index <= currentIndex ? "bg-gold-100 text-charcoal-900" : "bg-ivory-100 text-charcoal-300"}`}>{step.label}</li>)}</ol>
              {orderAddress && <p className="mt-4 text-xs text-charcoal-400">Delivering to {orderAddress.fullName}, {orderAddress.city}, {orderAddress.state} {orderAddress.pincode}</p>}
            </div>
          </div>
        </article>;
      })}</div>}
  </AccountPageFrame>;
}
