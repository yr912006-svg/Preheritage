"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Mail, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { safeAccountReturnPath } from "@/lib/customer-route-access";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordBytes = new TextEncoder().encode(formData.password).length;
    if (passwordBytes < 12 || passwordBytes > 72) {
      setError("Use a password between 12 and 72 UTF-8 bytes");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      // Sign in automatically
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (!signInResult?.ok || signInResult.error) throw new Error("Your account was created, but sign in could not be completed. Please sign in.");
      const callbackUrl = safeAccountReturnPath(new URLSearchParams(window.location.search).get("callbackUrl"));
      router.replace(callbackUrl);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-ivory-100 min-h-screen py-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-ivory-50 p-8 sm:p-10 rounded-sm border border-ivory-300 shadow-luxury">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="font-serif text-2xl font-bold text-charcoal-900 mt-6 mb-1">
            Become a Preheritage Patron
          </h1>
          <p className="text-xs text-charcoal-100 font-light">
            Create an account to preserve your orders and receive curated loom launches
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="reg-name" className="block text-charcoal-400 font-semibold mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-name"
                type="text"
                name="name"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Maharani Gayatri"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-ivory-300 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-charcoal-400 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-ivory-300 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-charcoal-400 font-semibold mb-1">Mobile Number (India)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-ivory-300 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-charcoal-400 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                maxLength={72}
                placeholder="12 to 72 UTF-8 bytes"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-ivory-300 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirmPassword" className="block text-charcoal-400 font-semibold mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="reg-confirmPassword"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-ivory-300 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] py-3.5 bg-charcoal-900 hover:bg-gold-600 disabled:bg-charcoal-200 text-ivory-50 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <span>{isLoading ? "Creating Account..." : "Create Patron Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-ivory-200 text-center text-xs text-charcoal-100">
          <span>Already have an account? </span>
          <Link href="/login" className="text-gold-700 hover:text-gold-900 font-bold underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
