import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export default async function OrdersAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("orders.read");
  return children;
}
