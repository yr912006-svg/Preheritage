/**
 * Utilities for database error classification, sanitization, and fallback management.
 */

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as { code?: string; name?: string; message?: string };

  // Known Prisma connection error codes:
  // P1000: Authentication failed
  // P1001: Can't reach database server
  // P1002: The database server was reached but timed out
  // P1008: Operations timed out
  // P1017: Server has closed the connection
  // P2024: Timed out fetching a new connection from the connection pool
  if (err.code && ["P1000", "P1001", "P1002", "P1008", "P1017", "P2024"].includes(err.code)) {
    return true;
  }

  // Socket and OS-level connection reset indicators
  const msg = err.message || "";
  if (
    msg.includes("10054") ||
    msg.includes("ConnectionReset") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("connection closed") ||
    msg.includes("forcibly closed by the remote host") ||
    msg.includes("Can't reach database") ||
    msg.includes("Socket closed") ||
    msg.includes("Timed out fetching a new connection")
  ) {
    return true;
  }

  return false;
}

export function sanitizeDbError(error: unknown): string {
  if (!error) return "Unknown database error";
  const raw = error instanceof Error ? error.message : String(error);

  // Redact credentials, user, password, and tokens
  return raw
    .replace(/postgresql:\/\/[^@\s]+@/gi, "postgresql://***:***@")
    .replace(/postgres:\/\/[^@\s]+@/gi, "postgres://***:***@")
    .replace(/password=[^\s;&]+/gi, "password=***")
    .replace(/user=[^\s;&]+/gi, "user=***");
}

