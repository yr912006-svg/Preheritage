"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    setToken(value);
    // Keep the one-time credential out of the address bar and browser history.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const passwordBytes = new TextEncoder().encode(password).length;
    if (passwordBytes < 12 || passwordBytes > 72) { setMessage("Use a password between 12 and 72 UTF-8 bytes."); return; }
    if (password !== confirmation) { setMessage("The passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/password-reset/complete", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "This reset link is invalid or expired.");
      setSuccess(true);
      setMessage(result.message);
      setPassword(""); setConfirmation(""); setToken("");
      try {
        await signOut({ redirect: false });
        router.replace("/login");
      } catch {
        setMessage("Password updated. Please sign out of this browser, then sign in with your new password.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset is temporarily unavailable.");
    } finally { setLoading(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-ivory-100 px-4 py-16">
    <section className="w-full max-w-md rounded-sm border border-ivory-300 bg-ivory-50 p-8 shadow-luxury">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">Choose a new password</h1>
      {!token && !success && <p role="alert" className="mt-3 text-sm text-rose-800">This reset link is missing or invalid. Request a new link to continue.</p>}
      {message && <p role={success ? "status" : "alert"} className="mt-3 text-sm text-charcoal-600">{message}</p>}
      {!success && token && <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-charcoal-700">New password
          <input type="password" required maxLength={72} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium text-charcoal-700">Confirm new password
          <input type="password" required maxLength={72} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2.5" />
        </label>
        <p className="text-xs text-charcoal-500">Use 12 to 72 UTF-8 bytes.</p>
        <button disabled={loading} className="w-full rounded bg-charcoal-900 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50">{loading ? "Updating…" : "Update password"}</button>
      </form>}
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-gold-800 hover:underline">Back to sign in</Link>
    </section>
  </main>;
}
