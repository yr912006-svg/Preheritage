import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export default async function InventoryAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("inventory.read");
  return children;
}
