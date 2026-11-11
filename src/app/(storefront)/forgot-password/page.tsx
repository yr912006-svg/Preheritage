"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/password-reset/request", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      // Keep the same acknowledgement for every address and delivery outcome.
      setSent(true);
    } finally { setLoading(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-ivory-100 px-4 py-16">
    <section className="w-full max-w-md rounded-sm border border-ivory-300 bg-ivory-50 p-8 shadow-luxury">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">Reset your password</h1>
      <p className="mt-2 text-sm text-charcoal-500">Enter your account email. If it matches an account, we&apos;ll send a time-limited reset link.</p>
      {sent ? <div role="status" className="mt-6 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">If an account matches that email, password reset instructions will be sent shortly.</div> :
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-charcoal-700">Email address
            <input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2.5" />
          </label>
          <button disabled={loading} className="w-full rounded bg-charcoal-900 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50">{loading ? "Sending…" : "Send reset instructions"}</button>
        </form>}
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-gold-800 hover:underline">Back to sign in</Link>
    </section>
  </main>;
}
