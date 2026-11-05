"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import type { Address } from "@prisma/client";

type Profile = { id: string; name: string | null; email: string | null; phone: string | null; gender: string | null; dob: string; image: string | null };

export function AccountSettings({ profile: initialProfile, addresses: initialAddresses }: { profile: Profile; addresses: Address[] }) {
  const [profile, setProfile] = useState(initialProfile);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [profileMessage, setProfileMessage] = useState("");
  const [addressMessage, setAddressMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState({ currentPassword: "", newPassword: "", confirmation: "" });
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [draft, setDraft] = useState({ fullName: initialProfile.name || "", phone: initialProfile.phone || "", pincode: "", houseFlat: "", area: "", landmark: "", city: "", state: "", country: "India", isDefault: false });

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSavingProfile(true); setProfileMessage("");
    try {
      const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Profile could not be saved.");
      setProfile(data.profile); setProfileMessage("Your profile has been saved.");
    } catch (error) { setProfileMessage(error instanceof Error ? error.message : "Profile could not be saved."); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSavingPassword(true); setPasswordMessage("");
    const passwordBytes = new TextEncoder().encode(passwordDraft.newPassword).length;
    if (passwordBytes < 12 || passwordBytes > 72) {
      setPasswordMessage("Use a password between 12 and 72 UTF-8 bytes."); setSavingPassword(false); return;
    }
    if (passwordDraft.newPassword !== passwordDraft.confirmation) {
      setPasswordMessage("The new passwords do not match."); setSavingPassword(false); return;
    }
    try {
      const response = await fetch("/api/account/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: passwordDraft.currentPassword, newPassword: passwordDraft.newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Password could not be changed.");
      setPasswordDraft({ currentPassword: "", newPassword: "", confirmation: "" });
      setPasswordMessage("Password updated. Signing you out of this browser…");
      try {
        await signOut({ redirect: false });
        window.location.assign("/login?passwordChanged=1");
      } catch {
        setPasswordMessage("Password changed, but sign-out did not complete. Please sign out of this browser manually.");
      }
    } catch (error) { setPasswordMessage(error instanceof Error ? error.message : "Password could not be changed."); }
    finally { setSavingPassword(false); }
  };

  const saveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSavingAddress(true); setAddressMessage("");
    try {
      const response = editingAddress
        ? await fetch(`/api/account/addresses/${editingAddress}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) })
        : await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Address could not be saved.");
      setAddresses((previous) => editingAddress
        ? previous.map((address) => ({ ...address, ...(draft.isDefault ? { isDefault: address.id === editingAddress } : {}), ...(address.id === editingAddress ? data.address : {}) }))
        : [data.address, ...previous.map((address) => ({ ...address, isDefault: false }))]);
      setEditingAddress(null);
      setDraft({ fullName: profile.name || "", phone: profile.phone || "", pincode: "", houseFlat: "", area: "", landmark: "", city: "", state: "", country: "India", isDefault: false });
      setAddressMessage(editingAddress ? "Delivery address updated." : "Delivery address saved.");
    } catch (error) { setAddressMessage(error instanceof Error ? error.message : "Address could not be saved."); }
    finally { setSavingAddress(false); }
  };

  const setDefault = async (address: Address) => {
    const response = await fetch(`/api/account/addresses/${address.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) });
    const data = await response.json();
    if (response.ok) setAddresses((previous) => previous.map((item) => ({ ...item, isDefault: item.id === address.id })));
    else setAddressMessage(data.message || "Could not update your default address.");
  };

  const deleteAddress = async (address: Address) => {
    const response = await fetch(`/api/account/addresses/${address.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) { setAddressMessage(data.message || "Could not remove this address."); return; }
    setAddresses((previous) => previous.filter((item) => item.id !== address.id));
  };

  const fieldClass = "w-full rounded border border-ivory-300 bg-white px-3 py-2.5 text-sm text-charcoal-900 focus:border-gold-500 focus:outline-none";
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-4 rounded-sm border border-ivory-300 bg-ivory-50 p-6 shadow-sm">
        <div><h2 className="font-serif text-xl font-bold text-charcoal-900">Personal details</h2><p className="mt-1 text-xs text-charcoal-400">Keep your contact details current for order updates.</p></div>
        {[{ key: "name", label: "Full name", type: "text" }, { key: "email", label: "Email address", type: "email" }, { key: "phone", label: "Mobile number", type: "tel" }, { key: "dob", label: "Date of birth", type: "date" }].map((field) => (
          <label key={field.key} className="block text-xs font-semibold text-charcoal-600">{field.label}<input className={`${fieldClass} mt-1`} type={field.type} value={(profile as any)[field.key] || ""} onChange={(event) => setProfile((previous) => ({ ...previous, [field.key]: event.target.value }))} required={field.key === "name" || field.key === "email"} /></label>
        ))}
        <label className="block text-xs font-semibold text-charcoal-600">Gender<select className={`${fieldClass} mt-1`} value={profile.gender || ""} onChange={(event) => setProfile((previous) => ({ ...previous, gender: event.target.value }))}><option value="">Select (optional)</option>{["Female", "Male", "Non-binary", "Prefer not to say"].map((gender) => <option key={gender}>{gender}</option>)}</select></label>
        {profileMessage && <p role="status" className="text-xs text-charcoal-600">{profileMessage}</p>}
        <button disabled={savingProfile} className="rounded bg-charcoal-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-gold-600 disabled:opacity-50">{savingProfile ? "Saving…" : "Save profile"}</button>
      </form>

      <div className="space-y-5">
        <form onSubmit={changePassword} className="space-y-4 rounded-sm border border-ivory-300 bg-ivory-50 p-6 shadow-sm">
          <div><h2 className="font-serif text-xl font-bold text-charcoal-900">Change password</h2><p className="mt-1 text-xs text-charcoal-400">Use 12 to 72 UTF-8 bytes. You will be signed out of this browser after the change.</p></div>
          <label className="block text-xs font-semibold text-charcoal-600">Current password<input className={`${fieldClass} mt-1`} type="password" autoComplete="current-password" required maxLength={200} value={passwordDraft.currentPassword} onChange={(event) => setPasswordDraft((previous) => ({ ...previous, currentPassword: event.target.value }))} /></label>
          <label className="block text-xs font-semibold text-charcoal-600">New password<input className={`${fieldClass} mt-1`} type="password" autoComplete="new-password" required maxLength={72} value={passwordDraft.newPassword} onChange={(event) => setPasswordDraft((previous) => ({ ...previous, newPassword: event.target.value }))} /></label>
          <label className="block text-xs font-semibold text-charcoal-600">Confirm new password<input className={`${fieldClass} mt-1`} type="password" autoComplete="new-password" required maxLength={72} value={passwordDraft.confirmation} onChange={(event) => setPasswordDraft((previous) => ({ ...previous, confirmation: event.target.value }))} /></label>
          {passwordMessage && <p role="status" className="text-xs text-charcoal-600">{passwordMessage}</p>}
          <button disabled={savingPassword} className="rounded bg-charcoal-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-gold-600 disabled:opacity-50">{savingPassword ? "Updating…" : "Update password"}</button>
        </form>
        <section className="rounded-sm border border-ivory-300 bg-ivory-50 p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-charcoal-900">Delivery addresses</h2>
          <div className="mt-4 space-y-3">
            {addresses.length === 0 && <p className="text-sm text-charcoal-400">No saved addresses yet.</p>}
            {addresses.map((address) => <article key={address.id} className="rounded border border-ivory-200 bg-white p-4 text-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-charcoal-900">{address.fullName} {address.isDefault && <span className="ml-1 text-[10px] uppercase tracking-wider text-gold-700">Default</span>}</p><p className="mt-1 text-charcoal-600">{address.houseFlat}, {address.area}{address.landmark ? `, ${address.landmark}` : ""}</p><p className="text-charcoal-600">{address.city}, {address.state} {address.pincode} · {address.phone}</p></div><div className="flex gap-3"><button type="button" onClick={() => { setEditingAddress(address.id); setDraft({ fullName: address.fullName, phone: address.phone, pincode: address.pincode, houseFlat: address.houseFlat, area: address.area, landmark: address.landmark || "", city: address.city, state: address.state, country: address.country, isDefault: address.isDefault }); setAddressMessage(""); }} className="text-xs font-semibold text-gold-800 hover:underline">Edit</button><button type="button" onClick={() => void deleteAddress(address)} className="text-xs text-rose-700 hover:underline">Remove</button></div></div>
              {!address.isDefault && <button type="button" onClick={() => void setDefault(address)} className="mt-3 text-xs font-semibold text-gold-800 hover:underline">Make default</button>}
            </article>)}
          </div>
          {addressMessage && <p role="status" className="mt-3 text-xs text-charcoal-600">{addressMessage}</p>}
        </section>

        <form onSubmit={saveAddress} className="grid gap-3 rounded-sm border border-ivory-300 bg-ivory-50 p-6 shadow-sm sm:grid-cols-2">
          <h2 className="font-serif text-xl font-bold text-charcoal-900 sm:col-span-2">{editingAddress ? "Edit delivery address" : "Add an address"}</h2>
          {[["fullName", "Recipient name"], ["phone", "Phone"], ["houseFlat", "House / flat"], ["area", "Area / street"], ["landmark", "Landmark (optional)"], ["city", "City"], ["state", "State"], ["pincode", "PIN code"]].map(([key, label]) => <label key={key} className="text-xs font-semibold text-charcoal-600">{label}<input className={`${fieldClass} mt-1`} value={(draft as any)[key]} onChange={(event) => setDraft((previous) => ({ ...previous, [key]: event.target.value }))} required={key !== "landmark"} maxLength={key === "pincode" ? 6 : 120} /></label>)}
          <div className="flex gap-3 sm:col-span-2"><button disabled={savingAddress} className="rounded bg-charcoal-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-gold-600 disabled:opacity-50">{savingAddress ? "Saving…" : editingAddress ? "Update address" : "Save address"}</button>{editingAddress && <button type="button" onClick={() => { setEditingAddress(null); setAddressMessage(""); }} className="rounded border border-ivory-400 px-5 py-2.5 text-xs font-semibold">Cancel</button>}</div>
        </form>
      </div>
    </div>
  );
}
