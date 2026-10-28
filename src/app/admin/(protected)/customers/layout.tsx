import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export default async function CustomersAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("customers.directory.read");
  return children;
}
