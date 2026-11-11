export type AddressInput = {
  fullName: string;
  phone: string;
  alternatePhone: string | null;
  pincode: string;
  houseFlat: string;
  area: string;
  landmark: string | null;
  city: string;
  state: string;
  country: string;
};

const ADDRESS_FIELDS = ["fullName", "phone", "alternatePhone", "pincode", "houseFlat", "area", "landmark", "city", "state", "country", "isDefault"];

export function normalizeAddressUpdate(body: unknown, current: Record<string, any>) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { valid: false as const };
  const patch = body as Record<string, unknown>;
  if (Object.keys(patch).some((key) => !ADDRESS_FIELDS.includes(key)) || Object.entries(patch).some(([, value]) => typeof value !== "string" && typeof value !== "boolean")) {
    return { valid: false as const };
  }
  const next = { ...current, ...patch };
  const text = (key: string, max: number, required = true) => (next[key] === null && !required) ||
    (typeof next[key] === "string" && (required ? Boolean(next[key].trim()) : true) && next[key].trim().length <= max);
  const valid = text("fullName", 100) && text("phone", 20) && /^[+\d\s()-]{10,20}$/.test(next.phone.trim()) &&
    text("pincode", 6) && /^\d{6}$/.test(next.pincode.trim()) && text("houseFlat", 120) && text("area", 120) &&
    text("city", 100) && text("state", 100) && text("country", 80) && text("alternatePhone", 20, false) &&
    (next.alternatePhone === null || next.alternatePhone === "" || /^[+\d\s()-]{10,20}$/.test(String(next.alternatePhone).trim())) &&
    text("landmark", 120, false) && typeof next.isDefault === "boolean";
  if (!valid) return { valid: false as const };
  return {
    valid: true as const,
    data: {
      fullName: next.fullName.trim(), phone: next.phone.trim(),
      alternatePhone: next.alternatePhone ? next.alternatePhone.trim() : null,
      pincode: next.pincode.trim(), houseFlat: next.houseFlat.trim(), area: next.area.trim(),
      landmark: next.landmark ? next.landmark.trim() : null, city: next.city.trim(), state: next.state.trim(), country: next.country.trim(),
    },
    isDefault: next.isDefault,
  };
}

export async function updateOwnedAddress(db: any, userId: string, addressId: string, body: unknown) {
  const existing = await db.address.findFirst({ where: { id: addressId, userId } });
  if (!existing) return { status: "not-found" as const };
  const normalized = normalizeAddressUpdate(body, existing);
  if (!normalized.valid) return { status: "invalid" as const };
  const address = await db.$transaction(async (tx: any) => {
    if (normalized.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.update({ where: { id: addressId, userId }, data: { ...normalized.data, isDefault: normalized.isDefault } });
  });
  return { status: "updated" as const, address };
}

export function selectCheckoutAddress(addresses: Array<Record<string, any>>, selectedId?: string | null) {
  return (selectedId && addresses.find((address) => address.id === selectedId)) || addresses.find((address) => address.isDefault) || addresses[0] || null;
}
