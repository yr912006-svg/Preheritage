"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  Heart,
  Tag,
  Bell,
  LifeBuoy,
  LogOut,
  Edit,
  Trash2,
  CheckCircle2,
  Truck,
  RotateCcw,
  Download,
  Plus,
  MessageCircle,
} from "lucide-react";
import { formatPrice, ORDER_TIMELINE_STEPS } from "@/lib/utils";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { COUPONS_LIST } from "@/lib/sample-data";

export default function CustomerAccountDashboard() {
  const [activeTab, setActiveTab] = useState<
    "ORDERS" | "PROFILE" | "ADDRESSES" | "WISHLIST" | "COUPONS" | "NOTIFICATIONS" | "SUPPORT"
  >("ORDERS");

  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Mock User Profile
  const [userProfile, setUserProfile] = useState({
    name: "Pooja Sharma",
    email: "customer@preheritage.com",
    phone: "+91 98765 43210",
    gender: "Female",
    dob: "1994-08-15",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([
    {
      id: "addr-1",
      fullName: "Pooja Sharma",
      phone: "+91 98765 43210",
      houseFlat: "Villa 14, Royal Palm Residences",
      area: "Golf Course Road",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122002",
      isDefault: true,
    },
    {
      id: "addr-2",
      fullName: "Pooja Sharma (Studio)",
      phone: "+91 98765 43210",
      houseFlat: "Floor 4, Heritage House",
      area: "Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      isDefault: false,
    },
  ]);

  // Orders
  const [orders, setOrders] = useState([
    {
      id: "ord-1",
      orderNumber: "PRE-2026-84920",
      date: "25 October 2026",
      status: "SHIPPED",
      totalAmount: 34999,
      paymentMethod: "Razorpay (UPI)",
      courier: "Shiprocket Express",
      trackingId: "SR-928472910IN",
      items: [
        {
          title: "Varanasi Rangkat Kadwa Silk Saree in Antique Gold",
          price: 34999,
          qty: 1,
          size: "Free Size",
          color: "Antique Gold",
          image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    {
      id: "ord-2",
      orderNumber: "PRE-2026-62104",
      date: "12 October 2026",
      status: "DELIVERED",
      totalAmount: 12499,
      paymentMethod: "Razorpay (Credit Card)",
      courier: "Delhivery Air",
      trackingId: "DLV-482019482",
      items: [
        {
          title: "Chanderi Handspun Silk-Cotton Kurta Set",
          price: 12499,
          qty: 1,
          size: "M",
          color: "Ivory Ecru",
          image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
  ]);

  // Notifications
  const [notifications] = useState([
    {
      id: "notif-1",
      title: "Royal Order Dispatched",
      text: "Your Varanasi Kadwa saree has been handed to Shiprocket courier partner with AWB SR-928472910IN.",
      time: "2 hours ago",
    },
    {
      id: "notif-2",
      title: "Private Loom Launch Preview",
      text: "The Marwar Splendor collection is now live for VIP patrons.",
      time: "2 days ago",
    },
  ]);

  // Return modal state
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReturnSubmitted(true);
    setTimeout(() => {
      setReturnSubmitted(false);
      setReturnOrderId(null);
    }, 2500);
  };

  return (
    <div className="bg-ivory-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Title & Patron Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-ivory-300 gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.22em] text-gold-600 font-bold block mb-1">
              Patron Concierge Dashboard
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
              Welcome, {userProfile.name}
            </h1>
            <p className="text-xs text-charcoal-100 font-light mt-1">
              {userProfile.email} • {userProfile.phone}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 bg-gold-100 text-gold-900 border border-gold-300 rounded text-xs font-semibold">
              ★ Royal Patron Tier
            </span>
            <Link
              href="/login"
              className="p-2 text-charcoal-200 hover:text-rose-700 hover:bg-ivory-200 rounded transition-colors text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-1 bg-ivory-50 p-4 rounded-sm border border-ivory-300 shadow-sm h-fit">
            {[
              { id: "ORDERS", label: "My Orders", icon: Package, badge: orders.length },
              { id: "PROFILE", label: "Profile Details", icon: User },
              { id: "ADDRESSES", label: "Saved Addresses", icon: MapPin, badge: addresses.length },
              { id: "WISHLIST", label: "My Wishlist", icon: Heart, badge: wishlist.length },
              { id: "COUPONS", label: "Coupons & Privileges", icon: Tag, badge: COUPONS_LIST.length },
              { id: "NOTIFICATIONS", label: "Notifications", icon: Bell, badge: notifications.length },
              { id: "SUPPORT", label: "Concierge & Support", icon: LifeBuoy },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-charcoal-900 text-ivory-50 shadow-sm"
                      : "text-charcoal-800 hover:bg-ivory-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-gold-400" : "text-charcoal-300"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isActive ? "bg-gold-500 text-charcoal-950 font-bold" : "bg-ivory-300 text-charcoal-800"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="lg:col-span-9">
            {/* 1. ORDERS TAB */}
            {activeTab === "ORDERS" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-bold text-charcoal-900">
                    Order History & Shipments
                  </h2>
                </div>

                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-ivory-50 rounded-sm border border-ivory-300 shadow-sm overflow-hidden"
                    >
                      {/* Order Header */}
                      <div className="bg-ivory-200/60 p-5 border-b border-ivory-300 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div>
                          <span className="text-charcoal-100 block">Order ID</span>
                          <span className="font-mono font-bold text-sm text-charcoal-900">
                            {order.orderNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-charcoal-100 block">Placed On</span>
                          <span className="font-semibold text-charcoal-800">{order.date}</span>
                        </div>
                        <div>
                          <span className="text-charcoal-100 block">Total Amount</span>
                          <span className="font-serif font-bold text-sm text-charcoal-900">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-charcoal-100 block">Status</span>
                          <span className="px-2.5 py-1 bg-gold-100 text-gold-900 border border-gold-300 rounded font-semibold text-[11px]">
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-6 divide-y divide-ivory-200">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="relative aspect-[3/4] w-16 rounded bg-ivory-200 overflow-hidden shrink-0">
                                <Image src={item.image} alt={item.title} fill className="object-cover" />
                              </div>
                              <div>
                                <h3 className="font-serif font-semibold text-sm text-charcoal-900">
                                  {item.title}
                                </h3>
                                <div className="text-xs text-charcoal-100 mt-0.5">
                                  Size: {item.size} • Color: {item.color} • Qty: {item.qty}
                                </div>
                                <div className="font-bold text-xs text-charcoal-900 mt-1">
                                  {formatPrice(item.price)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Link
                                href={`/track-order?orderId=${order.orderNumber}`}
                                className="flex-1 sm:flex-none px-4 py-2 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Track Parcel</span>
                              </Link>
                              <button
                                onClick={() => setReturnOrderId(order.orderNumber)}
                                className="px-3 py-2 bg-ivory-200 hover:bg-ivory-300 text-charcoal-800 text-xs font-medium rounded transition-colors"
                              >
                                Return / Exchange
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 bg-ivory-100/70 border-t border-ivory-200 flex flex-wrap items-center justify-between gap-2 text-xs text-charcoal-200">
                        <span>Courier: {order.courier} • AWB: {order.trackingId}</span>
                        <button
                          onClick={() => alert(`Downloading Invoice for ${order.orderNumber}...`)}
                          className="text-gold-700 hover:text-gold-900 font-semibold flex items-center gap-1 underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Tax Invoice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. PROFILE TAB */}
            {activeTab === "PROFILE" && (
              <div className="bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-ivory-300">
                  <h2 className="font-serif text-2xl font-bold text-charcoal-900">
                    Personal Profile Details
                  </h2>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs text-gold-700 hover:text-gold-900 font-semibold flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{isEditingProfile ? "Cancel" : "Edit Profile"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      className="w-full bg-white disabled:bg-ivory-100 border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-medium text-charcoal-900"
                    />
                  </div>

                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled={!isEditingProfile}
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                      className="w-full bg-white disabled:bg-ivory-100 border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-medium text-charcoal-900"
                    />
                  </div>

                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      disabled={!isEditingProfile}
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                      className="w-full bg-white disabled:bg-ivory-100 border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-medium text-charcoal-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">Gender</label>
                    <select
                      disabled={!isEditingProfile}
                      value={userProfile.gender}
                      onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value })}
                      className="w-full bg-white disabled:bg-ivory-100 border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 text-charcoal-900"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Prefer Not to Say">Prefer Not to Say</option>
                    </select>
                  </div>
                </div>

                {isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-2.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold rounded transition-colors"
                  >
                    Save Changes
                  </button>
                )}

                <div className="pt-8 border-t border-ivory-300 space-y-4">
                  <h3 className="font-serif text-lg font-bold text-charcoal-900">Security & Account</h3>
                  <button className="px-4 py-2 bg-ivory-200 text-charcoal-800 text-xs rounded hover:bg-ivory-300 transition-colors font-medium">
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* 3. ADDRESSES TAB */}
            {activeTab === "ADDRESSES" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-bold text-charcoal-900">Saved Delivery Addresses</h2>
                  <button className="px-4 py-2 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-wider font-semibold rounded flex items-center gap-1.5 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-6 rounded-sm border bg-ivory-50 shadow-sm relative flex flex-col justify-between ${
                        addr.isDefault ? "border-gold-600 ring-1 ring-gold-400" : "border-ivory-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-semibold text-sm text-charcoal-900">{addr.fullName}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-gold-100 text-gold-900 font-bold px-2 py-0.5 rounded uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-200 leading-relaxed font-light">
                          {addr.houseFlat}, {addr.area}
                          <br />
                          {addr.city}, {addr.state} - {addr.pincode}
                          <br />
                          Phone: {addr.phone}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-ivory-200 mt-4 flex items-center justify-between text-xs text-charcoal-100">
                        <button className="text-gold-700 hover:text-gold-900 font-medium">Edit</button>
                        {!addr.isDefault && (
                          <button className="text-charcoal-300 hover:text-charcoal-900">Set as Default</button>
                        )}
                        <button className="text-rose-600 hover:text-rose-800">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. WISHLIST TAB */}
            {activeTab === "WISHLIST" && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl font-bold text-charcoal-900">
                  Your Royal Wishlist ({wishlist.length})
                </h2>

                {wishlist.length === 0 ? (
                  <div className="bg-ivory-50 p-12 text-center rounded border border-ivory-300">
                    <Heart className="w-10 h-10 text-gold-500 mx-auto mb-3" />
                    <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-1">
                      Your wishlist is currently empty
                    </h3>
                    <p className="text-xs text-charcoal-100 mb-6">
                      Save limited-edition handcrafted sarees, kurtas, and pashminas to this space.
                    </p>
                    <Link
                      href="/shop"
                      className="px-6 py-2.5 bg-charcoal-900 text-ivory-50 text-xs uppercase tracking-widest font-semibold rounded hover:bg-gold-600"
                    >
                      Browse Collections
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="bg-ivory-50 rounded-sm border border-ivory-300 overflow-hidden shadow-sm flex flex-col justify-between"
                      >
                        <div className="relative aspect-[3/4] w-full bg-ivory-200">
                          <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-rose-600 hover:bg-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="font-serif font-bold text-sm text-charcoal-900 line-clamp-1 mb-1">
                            {item.title}
                          </h3>
                          <div className="font-bold text-sm text-charcoal-900 mb-3">
                            {formatPrice(item.price)}
                          </div>
                          <button
                            onClick={() => {
                              addToCart(item);
                              removeFromWishlist(item.id);
                            }}
                            className="w-full py-2 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-wider font-semibold rounded transition-colors"
                          >
                            Move to Bag
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. COUPONS TAB */}
            {activeTab === "COUPONS" && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl font-bold text-charcoal-900">
                  Exclusive Patron Privileges & Coupons
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COUPONS_LIST.map((c) => (
                    <div
                      key={c.code}
                      className="bg-ivory-50 p-6 rounded-sm border-2 border-dashed border-gold-400 shadow-sm relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-bold text-base text-gold-900 bg-gold-100 px-2.5 py-1 rounded">
                          {c.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-800">{c.discount}</span>
                      </div>
                      <p className="text-xs text-charcoal-200 font-light mt-2">{c.description}</p>
                      <span className="text-[10px] text-charcoal-100 block mt-3">
                        Min. Cart Value: {formatPrice(c.minSpend)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. NOTIFICATIONS TAB */}
            {activeTab === "NOTIFICATIONS" && (
              <div className="bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm space-y-4">
                <h2 className="font-serif text-2xl font-bold text-charcoal-900 pb-4 border-b border-ivory-300">
                  Order & Atelier Notifications
                </h2>
                <div className="divide-y divide-ivory-200">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-4 first:pt-0">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-charcoal-900">{n.title}</span>
                        <span className="text-charcoal-100">{n.time}</span>
                      </div>
                      <p className="text-xs text-charcoal-200 leading-relaxed font-light">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. SUPPORT TAB */}
            {activeTab === "SUPPORT" && (
              <div className="bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-charcoal-900">
                    Concierge & Patron Care
                  </h2>
                  <p className="text-xs text-charcoal-100 mt-1">
                    Have questions regarding sizing, custom weaves, or order logistics? Connect directly with our team.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noreferrer"
                    className="p-5 bg-emerald-50 border border-emerald-300 rounded text-emerald-950 flex items-center gap-4 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-sm block">Instant WhatsApp Concierge</span>
                      <span className="text-xs text-emerald-800">Reply within 15 minutes</span>
                    </div>
                  </a>

                  <div className="p-5 bg-gold-50 border border-gold-300 rounded text-gold-950 flex items-center gap-4">
                    <LifeBuoy className="w-8 h-8 text-gold-600 shrink-0" />
                    <div>
                      <span className="font-bold text-sm block">Email: care@preheritage.com</span>
                      <span className="text-xs text-gold-800">24x7 Dedicated Patron Desk</span>
                    </div>
                  </div>
                </div>

                {/* Return request form inside modal */}
                {returnOrderId && (
                  <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-ivory-50 p-6 rounded max-w-md w-full border border-ivory-300 shadow-2xl">
                      <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-2">
                        Return or Exchange Request
                      </h3>
                      <p className="text-xs text-charcoal-100 mb-4">
                        For order <strong>{returnOrderId}</strong>. Reverse pickup arranged via Shiprocket.
                      </p>

                      {returnSubmitted ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded">
                          ✓ Your return request has been submitted. Our concierge will contact you within 24 hours.
                        </div>
                      ) : (
                        <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
                          <div>
                            <label className="block text-charcoal-400 font-semibold mb-1">Reason for Return/Exchange</label>
                            <select
                              required
                              value={returnReason}
                              onChange={(e) => setReturnReason(e.target.value)}
                              className="w-full bg-white border border-ivory-300 p-2.5 rounded"
                            >
                              <option value="">Select a reason</option>
                              <option value="SIZE_EXCHANGE">Size Exchange Needed</option>
                              <option value="COLOR_PREFERENCE">Color Shade Exchange</option>
                              <option value="DEFECT">Defect / Damaged in Transit</option>
                              <option value="OTHER">Other Reason</option>
                            </select>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setReturnOrderId(null)}
                              className="px-4 py-2 bg-ivory-200 text-charcoal-900 rounded font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-charcoal-900 text-ivory-50 rounded font-semibold hover:bg-gold-600"
                            >
                              Submit Request
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
