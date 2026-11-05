import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { AccountPageFrame, AccountUnavailable } from "@/components/account/AccountNav";
import { loadCustomerInquiries } from "@/lib/customer-inquiries";

const statusLabels: Record<string, string> = {
  OPEN: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default async function CustomerInquiriesPage() {
  const user = await getCustomerUser();
  if (!user) redirect("/login?callbackUrl=%2Faccount%2Finquiries&reason=customer-required");
  const result = await loadCustomerInquiries(prisma, user.id);
  if (result.status !== "loaded") return <AccountUnavailable />;

  return (
    <AccountPageFrame active="/account/inquiries" title="My Inquiries">
      {result.inquiries.length === 0 ? (
        <section className="rounded-xs border border-ivory-300 bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold-300 bg-gold-50/60 text-gold-700">
            <MessageSquare className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-700 block mb-1">
            Private Concierge
          </span>
          <h2 className="font-serif text-2xl font-medium text-charcoal-900 sm:text-3xl">
            Direct Line to the Atelier
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-charcoal-600 font-light">
            Have questions regarding bespoke bridal orders, custom sleeve sizing, fabric swatches, or international shipping? Our advisors are here to assist.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xs bg-charcoal-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 transition-colors hover:bg-gold-600"
            >
              Contact Atelier Concierge
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center justify-center rounded-xs border border-charcoal-700 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-charcoal-900 transition-colors hover:border-gold-600 hover:text-gold-700"
            >
              Discover Collections
            </Link>
          </div>
        </section>
      ) : (
        <section aria-label="Your inquiries" className="space-y-3">
          {result.inquiries.map((inquiry) => (
            <article key={inquiry.id} className="rounded-sm border border-ivory-300 bg-ivory-50 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-charcoal-900">{inquiry.subject}</h2>
                  <p className="mt-1 text-xs text-charcoal-500">Sent {inquiry.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                </div>
                <span className="rounded-full border border-gold-500/40 bg-gold-100 px-3 py-1 text-xs font-semibold text-charcoal-800">
                  {statusLabels[inquiry.status] ?? "Received"}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-charcoal-500">
                Last updated {inquiry.updatedAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            </article>
          ))}
        </section>
      )}
    </AccountPageFrame>
  );
}
