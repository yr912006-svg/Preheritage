const MIN_PASSWORD_BYTES = 12;
const MAX_BCRYPT_PASSWORD_BYTES = 72;

export function isValidCustomerPassword(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const byteLength = Buffer.byteLength(value, "utf8");
  return byteLength >= MIN_PASSWORD_BYTES && byteLength <= MAX_BCRYPT_PASSWORD_BYTES;
}

export const CUSTOMER_PASSWORD_POLICY_MESSAGE = "Use a password between 12 and 72 UTF-8 bytes.";
