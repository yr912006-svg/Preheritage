"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import Logo from "@/components/layout/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("admin-credentials", { email, password, redirect: false });
    if (result?.ok) {
      const destination = new URLSearchParams(window.location.search).get("callbackUrl");
      router.replace(destination?.startsWith("/admin") && !destination.startsWith("//") ? destination : "/admin");
    } else {
      setError("Invalid administrative credentials");
      setLoading(false);
    }
  };

  return (
    <div className="bg-charcoal-950 min-h-screen py-20 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-charcoal-900 p-8 sm:p-10 rounded border border-charcoal-800 shadow-2xl text-ivory-100">
        <div className="text-center mb-8">
          <Logo variant="light" />
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-gold-950/80 border border-gold-600/50 rounded-full text-[10px] uppercase tracking-widest text-gold-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Personnel Only</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mt-4">
            Atelier Executive Portal
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-950/80 border border-rose-800 rounded text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-ivory-300 font-semibold mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-charcoal-950 border border-charcoal-700 text-white rounded focus:outline-none focus:border-gold-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-ivory-300 font-semibold mb-1">Administrative Secret Key</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-charcoal-950 border border-charcoal-700 text-white rounded focus:outline-none focus:border-gold-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 disabled:bg-charcoal-700 text-charcoal-950 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded transition-colors shadow-gold mt-6"
          >
            <span>{loading ? "Authenticating..." : "Unlock Atelier Console"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
