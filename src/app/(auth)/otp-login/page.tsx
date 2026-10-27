"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Smartphone, Lock, ArrowRight, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { safeAccountReturnPath } from "@/lib/customer-route-access";

function OtpLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeAccountReturnPath(searchParams.get("callbackUrl"));

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to dispatch OTP");

      setOtpSent(true);
      setCountdown(60);
      setCanResend(false);
      setMessage(data.message || "OTP sent to your phone");
      if (data.mockOtp) {
        setOtp(data.mockOtp);
      }
    } catch (err: any) {
      setError(err.message || "Could not send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("phone-otp", {
        phone,
        otp: otp.trim(),
        redirect: false,
      });

      if (!res?.ok || res.error) {
        setError("That verification code could not be confirmed. Request a new code and try again.");
        setIsLoading(false);
      } else {
        router.replace(callbackUrl);
      }
    } catch (err: any) {
      setError("Sign in could not be completed. Please request a new code and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-ivory-50 p-8 sm:p-10 rounded-sm border border-ivory-300 shadow-luxury">
      <div className="text-center mb-8">
        <Logo />
        <h1 className="font-serif text-2xl font-bold text-charcoal-900 mt-6 mb-1">
          Mobile Number Sign In
        </h1>
        <p className="text-xs text-charcoal-100 font-light">
          Fast, secure passwordless login with SMS verification
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {!otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
          <div>
            <label className="block text-charcoal-400 font-semibold mb-1">
              Enter Mobile Number (India)
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-ivory-200 border border-r-0 border-ivory-300 rounded-l text-xs font-semibold text-charcoal-800">
                +91
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="98765 43210"
                className="flex-1 p-2.5 bg-white border border-ivory-300 rounded-r text-xs focus:outline-none focus:border-gold-500 font-mono"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-charcoal-900 hover:bg-gold-600 disabled:bg-charcoal-200 text-ivory-50 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded transition-colors shadow-sm"
          >
            <span>{isLoading ? "Sending OTP..." : "Get Verification Code"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-charcoal-400 font-semibold">Enter 6-Digit OTP</label>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-gold-700 underline text-[11px]"
              >
                Change phone (+91 {phone})
              </button>
            </div>

            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="123456"
              className="w-full p-3 bg-white border border-ivory-300 rounded text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus:border-gold-500"
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center text-xs text-charcoal-100">
            {countdown > 0 ? (
              <span>Resend OTP in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-gold-700 hover:text-gold-900 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resend OTP</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-charcoal-900 hover:bg-gold-600 disabled:bg-charcoal-200 text-ivory-50 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded transition-colors shadow-sm"
          >
            <span>{isLoading ? "Verifying..." : "Verify & Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-ivory-200 text-center text-xs text-charcoal-100">
        <Link href="/login" className="text-charcoal-800 hover:text-gold-700 font-medium">
          ← Back to Email Sign In
        </Link>
      </div>
    </div>
  );
}

export default function OtpLoginPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16 flex items-center justify-center px-4">
      <Suspense fallback={<div className="font-serif text-lg text-charcoal-900">Loading Mobile Login...</div>}>
        <OtpLoginForm />
      </Suspense>
    </div>
  );
}
