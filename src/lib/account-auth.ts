import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  adminCapabilityStatus,
  hasAdminSession,
  type ActiveAdminRecord,
  type AdminCapability,
} from "@/lib/admin-session-access";

export type CustomerUserResolution =
  | { status: "authorized"; user: NonNullable<Awaited<ReturnType<typeof findActiveCustomer>>> }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

async function findActiveCustomer(id: string) {
  return prisma.user.findFirst({
    where: { id, role: "CUSTOMER", isActive: true },
    select: { id: true, name: true, email: true, phone: true, gender: true, dob: true, image: true },
  });
}

export async function resolveCustomerUser(): Promise<CustomerUserResolution> {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return { status: "unavailable" };
  }
  const identity = session?.user as { id?: string; role?: string; adminRole?: string } | undefined;
  if (!identity?.id || identity.role !== "CUSTOMER" || identity.adminRole) return { status: "unauthenticated" };

  try {
    const user = await findActiveCustomer(identity.id);
    return user ? { status: "authorized", user } : { status: "unauthenticated" };
  } catch {
    return { status: "unavailable" };
  }
}

export async function getCustomerUser() {
  const result = await resolveCustomerUser();
  return result.status === "authorized" ? result.user : null;
}

export async function requireAdminUser() {
  const identity = await getAdminSessionIdentity();
  if (!hasAdminSession(identity)) return { admin: null, status: 401 as const };

  try {
    // The session ID identifies the principal; permissions always come from
    // the current Admin row. Session role claims are deliberately ignored.
    const admin = await prisma.admin.findUnique({
      where: { id: identity.id! },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!admin?.isActive) return { admin: null, status: 403 as const };
    return { admin, status: 200 as const };
  } catch {
    return { admin: null, status: 503 as const };
  }
}

export async function requireAdminCapability(capability: AdminCapability) {
  const identity = await getAdminSessionIdentity();
  if (!hasAdminSession(identity)) return { admin: null, status: 401 as const };

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: identity.id! },
      select: { id: true, email: true, role: true, isActive: true },
    });
    const status = adminCapabilityStatus(identity, admin as ActiveAdminRecord | null, capability);
    return status === 200 ? { admin, status } : { admin: null, status };
  } catch {
    return { admin: null, status: 503 as const };
  }
}

export async function getAdminUser() {
  return (await requireAdminUser()).admin;
}

async function getAdminSessionIdentity() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user as { id?: string | null } | undefined;
  } catch {
    return undefined;
  }
}
