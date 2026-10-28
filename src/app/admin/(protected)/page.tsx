import AdminOverviewClient from "./AdminOverviewClient";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export default async function AdminOverviewPage() {
  await requireAdminPageCapability("analytics.sales.read");
  return <AdminOverviewClient />;
}
