import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Console | PREHERITAGE",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ivory-200/50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-ivory-50 border-b border-ivory-300 px-8 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-charcoal-900 text-lg">PREHERITAGE Atelier Control</span>
            <span className="text-xs bg-gold-100 text-charcoal-800 font-semibold px-2 py-0.5 rounded">Restricted access</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-charcoal-200">Authenticated administrator</span>
            <span className="w-8 h-8 rounded-full bg-gold-500 text-charcoal-950 font-bold flex items-center justify-center font-serif text-sm">PH</span>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
