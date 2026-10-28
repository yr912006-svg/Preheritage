import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export default async function InquiriesAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("inquiries.general.manage");
  return children;
}
