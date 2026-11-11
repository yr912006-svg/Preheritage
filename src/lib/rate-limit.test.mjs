import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "./rate-limit.ts";

test("rate limiter allows requests up to max within window", () => {
  const limiter = createRateLimiter({ windowMs: 1000, max: 3 });

  const r1 = limiter.check("client-1");
  assert.equal(r1.success, true);
  assert.equal(r1.remaining, 2);

  const r2 = limiter.check("client-1");
  assert.equal(r2.success, true);
  assert.equal(r2.remaining, 1);

  const r3 = limiter.check("client-1");
  assert.equal(r3.success, true);
  assert.equal(r3.remaining, 0);

  const r4 = limiter.check("client-1");
  assert.equal(r4.success, false);
  assert.equal(r4.remaining, 0);
});

test("rate limiter isolates different client keys", () => {
  const limiter = createRateLimiter({ windowMs: 1000, max: 2 });

  limiter.check("client-a");
  limiter.check("client-a");
  const blockedA = limiter.check("client-a");
  assert.equal(blockedA.success, false);

  const allowedB = limiter.check("client-b");
  assert.equal(allowedB.success, true);
  assert.equal(allowedB.remaining, 1);
});

test("rate limiter resets after window expiration", async () => {
  const limiter = createRateLimiter({ windowMs: 50, max: 1 });

  const first = limiter.check("client-exp");
  assert.equal(first.success, true);

  const blocked = limiter.check("client-exp");
  assert.equal(blocked.success, false);

  await new Promise((resolve) => setTimeout(resolve, 60));

  const afterExp = limiter.check("client-exp");
  assert.equal(afterExp.success, true);
});
