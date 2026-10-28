import { notFound, redirect } from "next/navigation";
import type { AdminCapability } from "@/lib/admin-session-access";
import { requireAdminCapability } from "@/lib/account-auth";

export async function requireAdminPageCapability(capability: AdminCapability) {
  const access = await requireAdminCapability(capability);
  if (access.status === 401) redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin")}`);
  if (access.status === 503) throw new Error("Administrator authorization is temporarily unavailable.");
  if (!access.admin) notFound();
  return access.admin;
}
