"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tags,
  Layers,
  BarChart3,
  Truck,
  MessageSquare,
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
} from "lucide-react";
import Logo from "../layout/Logo";
import { signOut } from "next-auth/react";

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
  { name: "Inventory", href: "/admin/inventory", icon: Layers },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Coupons", href: "/admin/coupons", icon: Tags },
  { name: "Banners & Content", href: "/admin/content", icon: BarChart3 },
  { name: "Shipping Rules", href: "/admin/shipping", icon: Truck },
  { name: "Reviews & Q&A", href: "/admin/reviews", icon: MessageSquare },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const [newInquiries, setNewInquiries] = useState(0);
  useEffect(() => {
    let active = true;
    void fetch("/api/admin/inquiries", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => {
      if (active && data?.inquiries) setNewInquiries(data.inquiries.filter((item: { status: string }) => item.status === "OPEN").length);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <aside className="w-64 bg-charcoal-950 text-ivory-200 border-r border-charcoal-800 flex flex-col justify-between min-h-screen shrink-0">
      <div>
        {/* Brand Lockup */}
        <div className="p-6 border-b border-charcoal-800 flex flex-col items-center">
          <Logo variant="light" showTagline={false} />
          <div className="mt-2 px-2.5 py-0.5 bg-gold-950 border border-gold-600/50 rounded text-[10px] uppercase tracking-widest text-gold-400 font-bold">
            Executive Admin Console
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded transition-all font-medium ${
                  isActive
                    ? "bg-gold-500 text-charcoal-950 font-bold shadow-sm"
                    : "text-ivory-300 hover:bg-charcoal-900 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-charcoal-950" : "text-gold-400"}`} />
                <span>{item.name}</span>
                {item.name === "Inquiries" && newInquiries > 0 && <span className="ml-auto min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{newInquiries}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Details */}
      <div className="p-4 border-t border-charcoal-800 space-y-2 text-xs">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 text-ivory-400 hover:text-white rounded hover:bg-charcoal-900"
        >
          <span>Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
