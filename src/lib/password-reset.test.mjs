import test from "node:test";
import assert from "node:assert/strict";
import { createPasswordResetService, hashPasswordResetToken, sendPasswordResetEmail } from "./password-reset.ts";

const now = () => new Date("2026-10-29T12:00:00.000Z");
const rawToken = "a".repeat(43);

function fixture() {
  const user = { id: "customer-1", email: "patron@example.test", role: "CUSTOMER", isActive: true, passwordHash: "old" };
  const tokens = new Map();
  const prisma = {
    user: {
      findUnique: async () => user,
    },
    verificationToken: {
      deleteMany: async ({ where }) => {
        let count = 0;
        for (const [key, value] of tokens) {
          if ((!where.identifier || value.identifier === where.identifier) && (!where.token || value.token === where.token) && (!where.expires || value.expires > where.expires.gt)) {
            tokens.delete(key); count += 1;
          }
        }
        return { count };
      },
      create: async ({ data }) => { tokens.set(data.token, data); return data; },
      findUnique: async ({ where }) => tokens.get(where.token) ?? null,
    },
    $transaction: async (callback) => callback({
      user: {
        findFirst: async ({ where }) => user.email === where.email && user.isActive && user.role === where.role ? { id: user.id } : null,
        update: async ({ data }) => { Object.assign(user, data); return user; },
      },
      verificationToken: null,
    }),
  };
  // The transaction client uses the same in-memory token delegates.
  prisma.$transaction = async (callback) => callback({ ...prisma, user: {
    findFirst: async ({ where }) => user.email === where.email && user.isActive && user.role === where.role ? { id: user.id } : null,
    update: async ({ data }) => { Object.assign(user, data); return user; },
  } });
  const service = createPasswordResetService({ prisma, now, createToken: () => rawToken, hashPassword: async (password) => `hashed:${password}` });
  return { service, tokens, user };
}

test("reset tokens are stored only as hashes", async () => {
  const { service, tokens } = fixture();
  const result = await service.createReset(" PATRON@example.test ");
  assert.equal(result.token, rawToken);
  assert.equal(tokens.has(rawToken), false);
  assert.equal(tokens.has(hashPasswordResetToken(rawToken)), true);
});

test("expired reset tokens are rejected without changing the password", async () => {
  const { service, tokens, user } = fixture();
  const hash = hashPasswordResetToken(rawToken);
  tokens.set(hash, { identifier: "password-reset:patron@example.test", token: hash, expires: new Date("2026-10-29T11:59:59.000Z") });
  assert.deepEqual(await service.completeReset(rawToken, "a-long-new-password"), { success: false, reason: "invalid" });
  assert.equal(user.passwordHash, "old");
});

test("a reset token is single-use and updates the password once", async () => {
  const { service, tokens, user } = fixture();
  const reset = await service.createReset("patron@example.test");
  assert.equal(tokens.size, 1);
  const first = await service.completeReset(reset.token, "a-long-new-password");
  const replay = await service.completeReset(reset.token, "another-long-password");
  assert.deepEqual(first, { success: true });
  assert.deepEqual(replay, { success: false, reason: "invalid" });
  assert.equal(user.passwordHash, "hashed:a-long-new-password");
  assert.equal(tokens.size, 0);
});

test("invalid tokens and deleted or inactive account identities cannot reset a password", async () => {
  const { service, tokens, user } = fixture();
  assert.deepEqual(await service.completeReset("not-a-valid-reset-token", "a-long-new-password"), { success: false, reason: "invalid" });
  const reset = await service.createReset("patron@example.test");
  user.isActive = false;
  assert.deepEqual(await service.completeReset(reset.token, "a-long-new-password"), { success: false, reason: "invalid" });
  assert.equal(user.passwordHash, "old");
});

test("email delivery fails closed without configuration and uses the mocked Resend transport when configured", async () => {
  let called = false;
  assert.equal(await sendPasswordResetEmail({ email: "patron@example.test", resetUrl: "https://shop.test/reset-password#token=x", fetcher: async () => { called = true; return new Response(); } }), false);
  assert.equal(called, false);
  let message;
  const sent = await sendPasswordResetEmail({
    email: "patron@example.test", resetUrl: "https://shop.test/reset-password#token=x", apiKey: "unit-test-key", from: "PREHERITAGE <test@example.test>",
    fetcher: async (_url, options) => { message = JSON.parse(options.body); return new Response(null, { status: 200 }); },
  });
  assert.equal(sent, true);
  assert.deepEqual(message.to, ["patron@example.test"]);
  assert.match(message.text, /#token=x/);
});
