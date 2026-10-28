import { Users, ShoppingBag, UserCheck } from "lucide-react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAdminUser } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { orders: number };
};

export default async function AdminCustomersPage() {
  let admin = null;
  let customers: Customer[] = [];
  let loadFailed = false;

  try {
    admin = await getAdminUser();
    if (!admin) redirect("/admin/login?callbackUrl=%2Fadmin%2Fcustomers");

    customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("Admin customers page could not load customer records.");
    loadFailed = true;
  }

  const activeCount = customers.filter((customer) => customer.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-700">Patron Relationships</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-charcoal-900">Customers</h1>
        <p className="mt-1 text-sm text-charcoal-500">Customer accounts and their order history.</p>
      </div>

      {loadFailed ? (
        <div role="alert" className="border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          <h2 className="font-semibold">Customer records could not be loaded.</h2>
          <p className="mt-1 text-xs">Check the database connection and try this page again.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric icon={<Users className="h-4 w-4" />} label="Customer accounts" value={customers.length} />
            <Metric icon={<UserCheck className="h-4 w-4" />} label="Active accounts" value={activeCount} />
          </div>

          <div className="overflow-x-auto border border-ivory-300 bg-ivory-50 shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-charcoal-900 text-[11px] uppercase tracking-wider text-ivory-100">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-300 text-charcoal-800">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white">
                    <td className="px-4 py-4">
                      <span className="font-semibold text-charcoal-900">{customer.name || "Unnamed customer"}</span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className="block">{customer.email || "No email"}</span>
                      <span className="mt-1 block text-charcoal-500">{customer.phone || "No phone"}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-charcoal-600">
                      {customer.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <ShoppingBag className="h-3.5 w-3.5 text-gold-700" />{customer._count.orders}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${customer.isActive ? "bg-emerald-50 text-emerald-800" : "bg-charcoal-100 text-charcoal-600"}`}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <Users className="mx-auto h-8 w-8 text-gold-600" />
                      <p className="mt-3 font-serif text-lg text-charcoal-900">No customer accounts yet</p>
                      <p className="mt-1 text-xs text-charcoal-500">New customer accounts will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 border border-ivory-300 bg-ivory-50 p-4">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-100 text-gold-800">{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">{label}</p>
        <p className="mt-0.5 font-serif text-xl font-bold text-charcoal-900">{value}</p>
      </div>
    </div>
  );
}
