import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { adminSessionStatus } from "@/lib/admin-session-access";

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
  const session = await getServerSession(authOptions);
  const identity = session?.user as { id?: string; role?: string; adminRole?: string; email?: string | null } | undefined;
  const status = adminSessionStatus(identity);
  if (status !== 200) {
    if (process.env.NODE_ENV === "development") {
      const diagnostics = await getAdminAuthDiagnostics(identity);
      console.info("Admin authorization diagnostic", {
        sessionExists: Boolean(session),
        userId: identity?.id ?? null,
        sessionRole: identity?.role ?? null,
        ...diagnostics,
        failedCondition: status === 401 ? "session user ID missing" : 'session role is not "ADMIN"',
        decision: "deny",
        status,
      });
    }
    return { admin: null, status };
  }
  const admin = await prisma.admin.findFirst({
    where: {
      isActive: true,
      OR: [
        { id: identity.id },
        ...(identity.email ? [{ email: { equals: identity.email.trim(), mode: "insensitive" as const } }] : []),
      ],
    },
    select: { id: true, email: true, role: true },
  });
  if (process.env.NODE_ENV === "development") {
    console.info("Admin authorization diagnostic", {
      sessionExists: Boolean(session),
      userId: identity.id,
      sessionRole: identity.role,
      databaseAdminRole: admin?.role ?? null,
      activeAdminRecordFound: Boolean(admin),
      failedCondition: admin ? null : "no active Admin row matched session ID or email",
      decision: admin ? "allow" : "active_admin_record_missing",
      status: admin ? 200 : 403,
    });
  }
  if (!admin) {
    return { admin: null, status: 403 as const };
  }
  return { admin, status: 200 as const };
}

export async function getAdminUser() {
  return (await requireAdminUser()).admin;
}

async function getAdminAuthDiagnostics(identity: { id?: string; email?: string | null } | undefined) {
  try {
    const [user, admin] = await Promise.all([
      identity?.id
        ? prisma.user.findUnique({ where: { id: identity.id }, select: { role: true } })
        : Promise.resolve(null),
      identity?.id || identity?.email
        ? prisma.admin.findFirst({
            where: {
              OR: [
                ...(identity.id ? [{ id: identity.id }] : []),
                ...(identity.email ? [{ email: { equals: identity.email.trim(), mode: "insensitive" as const } }] : []),
              ],
            },
            select: { role: true, isActive: true },
          })
        : Promise.resolve(null),
    ]);
    return {
      databaseUserRole: user?.role ?? null,
      databaseAdminRole: admin?.role ?? null,
      activeAdminRecordFound: Boolean(admin?.isActive),
    };
  } catch {
    return {
      databaseUserRole: "unavailable",
      databaseAdminRole: "unavailable",
      activeAdminRecordFound: "unavailable",
    };
  }
}
