
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { withAdminCapability } from "@/lib/admin-api-access";
import { getSellableStock } from "@/lib/inventory";

async function getOverview(_request: Request) {
  try {
    const productAccess = await requireAdminCapability("products.read");
    const inventoryAccess = await requireAdminCapability("inventory.read");
    const customerAccess = await requireAdminCapability(
      "customers.directory.read"
    );

    const dateParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const datePart = (type: string) =>
      dateParts.find((part) => part.type === type)?.value ?? "";

    const indiaDate =
      `${datePart("year")}-${datePart("month")}-${datePart("day")}`;

    const startOfToday = new Date(`${indiaDate}T00:00:00+05:30`);

    const [
      todayOrders,
      todayPaidOrders,
      totalOrders,
      totalPaidOrders,
      recentOrders,
      statusGroups,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          paymentStatus: "SUCCESS",
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: {
          paymentStatus: "SUCCESS",
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          guestName: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    let activeProducts: number | null = null;
    let lowStockCount: number | null = null;
    let customerCount: number | null = null;

    if (productAccess.status === 200) {
      activeProducts = await prisma.product.count({
        where: { status: "ACTIVE" },
      });
    }

    if (inventoryAccess.status === 200) {
      const products = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: {
          stock: true,
          status: true,
          lowStockAlert: true,
          variants: {
            select: { stock: true },
          },
        },
      });

      lowStockCount = products.filter(
        (product) =>
          getSellableStock(product) <= product.lowStockAlert
      ).length;
    }

    if (customerAccess.status === 200) {
      customerCount = await prisma.user.count({
        where: { role: "CUSTOMER" },
      });
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      metrics: {
        todayOrders,
        todayPaidSales: todayPaidOrders._sum.totalAmount ?? 0,
        totalOrders,
        totalPaidRevenue: totalPaidOrders._sum.totalAmount ?? 0,
        activeProducts,
        lowStockCount,
        customerCount,
      },
      orderStatuses: Object.fromEntries(
        statusGroups.map((group) => [
          group.status,
          group._count._all,
        ])
      ),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName:
          order.guestName || order.user?.name || "Guest",
        amount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin dashboard overview failed:", error);

    return NextResponse.json(
      { message: "Could not load dashboard data." },
      { status: 503 }
    );
  }
}

export const GET = withAdminCapability(
  "analytics.sales.read",
  getOverview,
  requireAdminCapability
);
