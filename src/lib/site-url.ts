/**
 * Returns the normalized production canonical base URL.
 * Defaults to 'https://preheritage.com'.
 */
export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/\/+$/, "");
  }
  return "https://preheritage.com";
}
