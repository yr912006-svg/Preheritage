"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Mail, ArrowRight, Smartphone, AlertCircle } from "lucide-react";
import Logo from "@/components/layout/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="w-full max-w-md bg-ivory-50 p-8 sm:p-10 rounded-sm border border-ivory-300 shadow-luxury">
      <div className="text-center mb-8">
        <Logo />
        <h1 className="font-serif text-2xl font-bold text-charcoal-900 mt-6 mb-1">
          Sign In to Preheritage
        </h1>
        <p className="text-xs text-charcoal-100 font-light">
          Access your orders, addresses, and saved royal heirloom wishlist
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Google OAuth Login */}
      <button
        onClick={handleGoogleSignIn}
        type="button"
        className="w-full py-2.5 px-4 bg-white hover:bg-ivory-100 border border-ivory-300 rounded text-xs font-semibold text-charcoal-800 flex items-center justify-center gap-3 transition-colors mb-4 shadow-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Mobile OTP Login switch */}
      <Link
        href="/otp-login"
        className="w-full py-2.5 px-4 bg-ivory-100 hover:bg-ivory-200 border border-ivory-300 rounded text-xs font-semibold text-charcoal-800 flex items-center justify-center gap-2 transition-colors mb-6"
      >
        <Smartphone className="w-4 h-4 text-gold-600" />
        <span>Login with Mobile Number & OTP</span>
      </Link>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ivory-300" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-ivory-50 px-3 text-charcoal-100 uppercase tracking-wider text-[10px]">
            Or with email password
          </span>
        </div>
      </div>

      {/* Email & Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-charcoal-400 font-semibold mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-ivory-300 rounded focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-charcoal-400 font-semibold">Password</label>
            <Link href="#" className="text-[11px] text-gold-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-ivory-300 rounded focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-charcoal-900 hover:bg-gold-600 disabled:bg-charcoal-200 text-ivory-50 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded transition-colors shadow-sm"
        >
          <span>{isLoading ? "Verifying..." : "Sign In"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-ivory-200 text-center text-xs text-charcoal-100">
        <span>Don&apos;t have an account yet? </span>
        <Link href="/register" className="text-gold-700 hover:text-gold-900 font-bold underline">
          Register as a Patron
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16 flex items-center justify-center px-4">
      <Suspense fallback={<div className="font-serif text-lg text-charcoal-900">Loading Preheritage Sign In...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
