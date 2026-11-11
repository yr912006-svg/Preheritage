import { createHash, randomBytes } from "node:crypto";
import { isValidCustomerPassword } from "./customer-password-policy";

const RESET_IDENTIFIER_PREFIX = "password-reset:";
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetService(input: {
  prisma: any;
  now?: () => Date;
  createToken?: () => string;
  hashPassword: (password: string) => Promise<string>;
}) {
  const now = input.now ?? (() => new Date());
  const createToken = input.createToken ?? (() => randomBytes(32).toString("base64url"));

  return {
    async createReset(emailInput: string) {
      const email = emailInput.trim().toLowerCase();
      const user = await input.prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, isActive: true } });
      if (!user?.email || user.role !== "CUSTOMER" || !user.isActive) return null;

      const token = createToken();
      const identifier = `${RESET_IDENTIFIER_PREFIX}${email}`;
      const tokenHash = hashPasswordResetToken(token);
      const expires = new Date(now().getTime() + RESET_TOKEN_TTL_MS);
      await input.prisma.$transaction(async (tx: any) => {
        await tx.verificationToken.deleteMany({ where: { identifier } });
        await tx.verificationToken.create({ data: { identifier, token: tokenHash, expires } });
      });
      return { token, email, expires };
    },

    async completeReset(token: unknown, password: unknown) {
      if (typeof token !== "string" || token.length < 32 || token.length > 200 || !isValidCustomerPassword(password)) {
        return { success: false as const, reason: "invalid" as const };
      }
      const tokenHash = hashPasswordResetToken(token);
      const currentTime = now();
      return input.prisma.$transaction(async (tx: any) => {
        const stored = await tx.verificationToken.findUnique({ where: { token: tokenHash }, select: { identifier: true, expires: true } });
        if (!stored || !stored.identifier.startsWith(RESET_IDENTIFIER_PREFIX) || stored.expires <= currentTime) {
          return { success: false as const, reason: "invalid" as const };
        }
        const consumed = await tx.verificationToken.deleteMany({
          where: { token: tokenHash, identifier: stored.identifier, expires: { gt: currentTime } },
        });
        if (consumed.count !== 1) return { success: false as const, reason: "invalid" as const };

        const identifier = stored.identifier;
        const email = identifier.slice(RESET_IDENTIFIER_PREFIX.length);
        const user = await tx.user.findFirst({ where: { email, role: "CUSTOMER", isActive: true }, select: { id: true } });
        if (!user) return { success: false as const, reason: "invalid" as const };
        const passwordHash = await input.hashPassword(password);
        await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
        await tx.verificationToken.deleteMany({ where: { identifier } });
        return { success: true as const };
      });
    },
  };
}

export async function sendPasswordResetEmail(input: {
  email: string;
  resetUrl: string;
  apiKey?: string;
  from?: string;
  fetcher?: typeof fetch;
}) {
  if (!input.apiKey || !input.from) return false;
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: input.from,
      to: [input.email],
      subject: "Reset your PREHERITAGE password",
      text: `Use this link to reset your password. It expires in 30 minutes and can be used once: ${input.resetUrl}`,
    }),
  });
  return response.ok;
}
