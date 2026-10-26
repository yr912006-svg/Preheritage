import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getCustomerUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string; role?: string } | undefined)?.id;
  if (!userId) return null;

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "CUSTOMER", isActive: true },
    select: { id: true, name: true, email: true, phone: true, gender: true, dob: true, image: true },
  });
  return user ?? null;
}

export async function getAdminUser() {
  const session = await getServerSession(authOptions);
  const identity = session?.user as { id?: string; role?: string; adminRole?: string; email?: string | null } | undefined;
  if (identity?.role !== "ADMIN" || typeof identity.adminRole !== "string" || !identity.email) return null;
  return prisma.admin.findFirst({
    where: { email: identity.email.toLowerCase(), isActive: true },
    select: { id: true, email: true, role: true },
  });
}
