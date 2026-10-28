
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

type DashboardMetrics = {
  todayOrders: number;
  todayPaidSales: number;
  totalOrders: number;
  totalPaidRevenue: number;
  activeProducts: number | null;
  lowStockCount: number | null;
  customerCount: number | null;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

type DashboardData = {
  generatedAt: string;
  metrics: DashboardMetrics;
  orderStatuses: Record<string, number>;
  recentOrders: RecentOrder[];
};

const pipeline = [
  {
    label: "Placed",
    key: "PLACED",
    color: "bg-blue-50 text-blue-800 border-blue-200",
    icon: Clock,
  },
  {
    label: "Confirmed",
    key: "CONFIRMED",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    icon: CheckCircle2,
  },
  {
    label: "Packed",
    key: "PACKED",
    color: "bg-purple-50 text-purple-800 border-purple-200",
    icon: Package,
  },
  {
    label: "Shipped",
    key: "SHIPPED",
    color: "bg-gold-50 text-gold-900 border-gold-300",
    icon: Truck,
  },
  {
    label: "Out for delivery",
    key: "OUT_FOR_DELIVERY",
    color: "bg-indigo-50 text-indigo-800 border-indigo-200",
    icon: Truck,
  },
  {
    label: "Delivered",
    key: "DELIVERED",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function displayStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusColor(status: string) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "bg-gold-100 text-gold-900";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-rose-100 text-rose-800";
    case "PACKED":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-blue-100 text-blue-900";
  }
}

function metricValue(value: number | null, suffix = "") {
  return value === null ? "No access" : `${value.toLocaleString("en-IN")}${suffix}`;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/overview", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result?.message === "string"
            ? result.message
            : "Unable to load dashboard data."
        );
      }

      if (
        !result?.metrics ||
        !result?.orderStatuses ||
        !Array.isArray(result?.recentOrders)
      ) {
        throw new Error("The dashboard API returned an unexpected response.");
      }

      setData(result as DashboardData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = data?.metrics;
  const orderStatuses = data?.orderStatuses ?? {};

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            Executive Performance Overview
          </h1>
          <p className="text-xs text-charcoal-100 font-light mt-1">
            Store performance for PREHERITAGE official store • preheritage.com
          </p>
          {data?.generatedAt && (
            <p className="text-[11px] text-charcoal-400 mt-1">
              Data retrieved: {formatDate(data.generatedAt)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-ivory-300 text-charcoal-900 text-xs font-semibold uppercase tracking-wider rounded hover:bg-ivory-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-sm"
          >
            + Add New Heirloom Product
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-rose-200 bg-rose-50 text-rose-900 rounded-sm"
        >
          <div>
            <p className="font-semibold text-sm">Dashboard data unavailable</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="shrink-0 px-3 py-2 border border-rose-300 rounded text-xs font-semibold hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-charcoal-100 mb-2">
            <span>Today&apos;s Paid Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-charcoal-900">
            {loading && !data
              ? "Loading..."
              : stats
                ? formatPrice(stats.todayPaidSales)
                : "—"}
          </div>
          <div className="text-[11px] text-charcoal-100 mt-1">
            {loading && !data
              ? "Fetching store data"
              : stats
                ? `${stats.todayOrders.toLocaleString("en-IN")} orders placed today`
                : "Unavailable until data loads"}
          </div>
        </div>

        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-charcoal-100 mb-2">
            <span>All-Time Paid Revenue</span>
            <ShoppingBag className="w-4 h-4 text-gold-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-charcoal-900">
            {loading && !data
              ? "Loading..."
              : stats
                ? formatPrice(stats.totalPaidRevenue)
                : "—"}
          </div>
          <div className="text-[11px] text-charcoal-100 mt-1">
            {stats
              ? `${stats.totalOrders.toLocaleString("en-IN")} total orders`
              : "Revenue unavailable"}
          </div>
        </div>

        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-charcoal-100 mb-2">
            <span>Registered Patrons</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-charcoal-900">
            {loading && !data
              ? "Loading..."
              : stats
                ? metricValue(stats.customerCount)
                : "—"}
          </div>
          <div className="text-[11px] text-charcoal-100 mt-1">
            Registered customer accounts
          </div>
        </div>

        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-charcoal-100 mb-2">
            <span>Catalog & Inventory</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-charcoal-900">
            {loading && !data
              ? "Loading..."
              : stats
                ? metricValue(stats.activeProducts, " Live Pieces")
                : "—"}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {loading && !data
                ? "Checking stock..."
                : stats?.lowStockCount === null
                  ? "Inventory access required"
                  : stats
                    ? `${stats.lowStockCount} products at low stock`
                    : "Inventory unavailable"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
        <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-4">
          Atelier Order Pipeline Status
        </h3>

        {loading && !data ? (
          <p className="text-sm text-charcoal-400">Loading order statuses...</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              {pipeline.map((pipe) => {
                const Icon = pipe.icon;

                return (
                  <div
                    key={pipe.key}
                    className={`p-3.5 rounded border ${pipe.color}`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-2" />
                    <span className="font-serif font-bold text-xl block">
                      {(orderStatuses[pipe.key] ?? 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider font-semibold">
                      {pipe.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs text-charcoal-500">
              <span>
                Cancelled: {(orderStatuses.CANCELLED ?? 0).toLocaleString("en-IN")}
              </span>
              <span>
                Refunded: {(orderStatuses.REFUNDED ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-charcoal-400">
            Order statuses will appear when dashboard data is available.
          </p>
        )}
      </div>

      <div className="bg-ivory-50 rounded-sm border border-ivory-300 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-ivory-300 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-charcoal-900">
            Recent Patron Orders
          </h3>
          <Link
            href="/admin/orders"
            className="text-xs uppercase tracking-wider text-gold-700 hover:text-gold-900 font-semibold flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left divide-y divide-ivory-300">
            <thead className="bg-ivory-100 text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Order Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-charcoal-800 font-medium">
              {loading && !data ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    Loading recent orders...
                  </td>
                </tr>
              ) : !data ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    Orders are unavailable. Try refreshing the dashboard.
                  </td>
                </tr>
              ) : data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    No orders have been recorded yet.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-ivory-100/60 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-charcoal-900">
                      {order.orderNumber}
                    </td>
                    <td className="p-4">{order.customerName}</td>
                    <td className="p-4 text-charcoal-200 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-4 font-serif font-bold text-sm text-charcoal-900 whitespace-nowrap">
                      {formatPrice(order.amount)}
                    </td>
                    <td className="p-4">
                      <span className="text-charcoal-700">
                        {displayStatus(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(order.status)}`}
                      >
                        {displayStatus(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href="/admin/orders"
                        className="text-gold-700 hover:text-gold-900 font-bold underline text-[11px]"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-charcoal-400">
        <RotateCcw className="w-3.5 h-3.5" />
        <span>
          Figures are loaded from the store database. Revenue shown here is
          successful-payment revenue, excluding cancelled and refunded orders.
        </span>
      </div>
    </div>
  );
}
