"use client";

import { useState } from "react";
import type { Address } from "@prisma/client";

type Profile = { id: string; name: string | null; email: string | null; phone: string | null; gender: string | null; dob: string; image: string | null };

export function AccountSettings({ profile: initialProfile, addresses: initialAddresses }: { profile: Profile; addresses: Address[] }) {
  const [profile, setProfile] = useState(initialProfile);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [profileMessage, setProfileMessage] = useState("");
  const [addressMessage, setAddressMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [draft, setDraft] = useState({ fullName: initialProfile.name || "", phone: initialProfile.phone || "", pincode: "", houseFlat: "", area: "", landmark: "", city: "", state: "", country: "India" });

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

  const addAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSavingAddress(true); setAddressMessage("");
    try {
      const response = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Address could not be saved.");
      setAddresses((previous) => [data.address, ...previous.map((address) => ({ ...address, isDefault: false }))]);
      setDraft({ fullName: profile.name || "", phone: profile.phone || "", pincode: "", houseFlat: "", area: "", landmark: "", city: "", state: "", country: "India" });
      setAddressMessage("Delivery address saved.");
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
        <section className="rounded-sm border border-ivory-300 bg-ivory-50 p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-charcoal-900">Delivery addresses</h2>
          <div className="mt-4 space-y-3">
            {addresses.length === 0 && <p className="text-sm text-charcoal-400">No saved addresses yet.</p>}
            {addresses.map((address) => <article key={address.id} className="rounded border border-ivory-200 bg-white p-4 text-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-charcoal-900">{address.fullName} {address.isDefault && <span className="ml-1 text-[10px] uppercase tracking-wider text-gold-700">Default</span>}</p><p className="mt-1 text-charcoal-600">{address.houseFlat}, {address.area}{address.landmark ? `, ${address.landmark}` : ""}</p><p className="text-charcoal-600">{address.city}, {address.state} {address.pincode} · {address.phone}</p></div><button type="button" onClick={() => void deleteAddress(address)} className="text-xs text-rose-700 hover:underline">Remove</button></div>
              {!address.isDefault && <button type="button" onClick={() => void setDefault(address)} className="mt-3 text-xs font-semibold text-gold-800 hover:underline">Make default</button>}
            </article>)}
          </div>
          {addressMessage && <p role="status" className="mt-3 text-xs text-charcoal-600">{addressMessage}</p>}
        </section>

        <form onSubmit={addAddress} className="grid gap-3 rounded-sm border border-ivory-300 bg-ivory-50 p-6 shadow-sm sm:grid-cols-2">
          <h2 className="font-serif text-xl font-bold text-charcoal-900 sm:col-span-2">Add an address</h2>
          {[["fullName", "Recipient name"], ["phone", "Phone"], ["houseFlat", "House / flat"], ["area", "Area / street"], ["landmark", "Landmark (optional)"], ["city", "City"], ["state", "State"], ["pincode", "PIN code"]].map(([key, label]) => <label key={key} className="text-xs font-semibold text-charcoal-600">{label}<input className={`${fieldClass} mt-1`} value={(draft as any)[key]} onChange={(event) => setDraft((previous) => ({ ...previous, [key]: event.target.value }))} required={key !== "landmark"} maxLength={key === "pincode" ? 6 : 120} /></label>)}
          <button disabled={savingAddress} className="rounded bg-charcoal-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-gold-600 disabled:opacity-50 sm:col-span-2">{savingAddress ? "Saving…" : "Save address"}</button>
        </form>
      </div>
    </div>
  );
}
