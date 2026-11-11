import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export const metadata = {
  title: "Shipping Rules | PREHERITAGE Atelier Control",
};

export default async function ShippingLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("orders.manage");
  return children;
}
