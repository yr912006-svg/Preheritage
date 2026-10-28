export type AdminSessionIdentity = { id?: string | null; role?: string | null } | null | undefined;

export function adminSessionStatus(identity: AdminSessionIdentity): 200 | 401 | 403 {
  if (!identity?.id) return 401;
  return identity.role === "ADMIN" ? 200 : 403;
}
