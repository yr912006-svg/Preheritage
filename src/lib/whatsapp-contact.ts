export function normalizeWhatsAppNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input || !/^[+\d\s().-]+$/.test(input)) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;
  return digits;
}

export function buildWhatsAppContactUrl(number: unknown, message?: string): string | null {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;
  const url = new URL(`https://wa.me/${normalized}`);
  if (message) url.searchParams.set("text", message);
  return url.toString();
}
