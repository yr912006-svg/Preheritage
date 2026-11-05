import { requireAdminPageCapability } from "@/lib/admin-page-access";
import ReturnRequestsDashboard from "./ReturnRequestsDashboard";

export default async function ReturnsPage() {
  await requireAdminPageCapability("returns.manage");
  return <ReturnRequestsDashboard />;
}
