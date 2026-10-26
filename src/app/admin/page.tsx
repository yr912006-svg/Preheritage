"use client";

import React from "react";
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
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";

export default function AdminOverviewPage() {
  const stats = {
    todaySales: 82497,
    todayOrders: 3,
    totalRevenue: 1482300,
    totalOrders: 128,
    totalCustomers: 342,
    activeProducts: SAMPLE_PRODUCTS.length,
    lowStockCount: 2,
  };

  const recentOrders = [
    {
      id: "ord-101",
      orderNumber: "PRE-2026-84920",
      customer: "Pooja Sharma",
      city: "Gurugram, HR",
      amount: 34999,
      status: "SHIPPED",
      method: "Razorpay (UPI)",
      time: "25 min ago",
    },
    {
      id: "ord-102",
      orderNumber: "PRE-2026-84919",
      customer: "Raghavendra Singhania",
      city: "Mumbai, MH",
      amount: 52999,
      status: "PACKED",
      method: "Razorpay (Card)",
      time: "1 hour ago",
    },
    {
      id: "ord-103",
      orderNumber: "PRE-2026-84918",
      customer: "Devika Pillai",
      city: "Bengaluru, KA",
      amount: 28999,
      status: "CONFIRMED",
      method: "Cash on Delivery",
      time: "3 hours ago",
    },
    {
      id: "ord-104",
      orderNumber: "PRE-2026-84917",
      customer: "Anya Sharma",
      city: "New York, USA",
      amount: 41200,
      status: "DELIVERED",
      method: "Stripe International",
      time: "Yesterday",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            Executive Performance Overview
          </h1>
          <p className="text-xs text-charcoal-100 font-light mt-1">
            Real-time analytics for PREHERITAGE official store • preheritage.com
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-sm"
          >
            + Add New Heirloom Product
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-charcoal-100 mb-2">
            <span>Today&apos;s Gross Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-charcoal-900">
            {formatPrice(stats.todaySales)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            +18.4% compared to yesterday
          </div>
        </div>

        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-charcoal-100 mb-2">
            <span>All-Time Gross Revenue</span>
            <ShoppingBag className="w-4 h-4 text-gold-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-charcoal-900">
            {formatPrice(stats.totalRevenue)}
          </div>
          <div className="text-[11px] text-charcoal-100 mt-1">
            Across 128 orders processed
          </div>
        </div>

        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-charcoal-100 mb-2">
            <span>Registered Patrons</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-charcoal-900">
            {stats.totalCustomers}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            +14 new patrons this week
          </div>
        </div>

        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
          <div className="flex items-center justify-between text-xs text-charcoal-100 mb-2">
            <span>Catalog & Inventory</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-charcoal-900">
            {stats.activeProducts} Live Pieces
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{stats.lowStockCount} items at low stock</span>
          </div>
        </div>
      </div>

      {/* Orders Pipeline Breakdown */}
      <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
        <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-4">
          Atelier Order Pipeline Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {[
            { label: "Placed", count: 4, color: "bg-blue-50 text-blue-800 border-blue-200" },
            { label: "Confirmed", count: 3, color: "bg-amber-50 text-amber-800 border-amber-200" },
            { label: "Packed", count: 2, color: "bg-purple-50 text-purple-800 border-purple-200" },
            { label: "Shipped", count: 7, color: "bg-gold-50 text-gold-900 border-gold-300" },
            { label: "Delivered", count: 110, color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
            { label: "Returns", count: 2, color: "bg-rose-50 text-rose-800 border-rose-200" },
          ].map((pipe) => (
            <div key={pipe.label} className={`p-3.5 rounded border ${pipe.color}`}>
              <span className="font-serif font-bold text-xl block">{pipe.count}</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold">{pipe.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-ivory-50 rounded-sm border border-ivory-300 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-ivory-300 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-charcoal-900">Recent Patron Orders</h3>
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
                <th className="p-4">Destination</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-charcoal-800 font-medium">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-ivory-100/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-charcoal-900">{ord.orderNumber}</td>
                  <td className="p-4">{ord.customer}</td>
                  <td className="p-4 text-charcoal-200">{ord.city}</td>
                  <td className="p-4 font-serif font-bold text-sm text-charcoal-900">
                    {formatPrice(ord.amount)}
                  </td>
                  <td className="p-4 text-charcoal-100">{ord.method}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : ord.status === "SHIPPED"
                          ? "bg-gold-100 text-gold-900"
                          : "bg-blue-100 text-blue-900"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/orders`}
                      className="text-gold-700 hover:text-gold-900 font-bold underline text-[11px]"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
