import test from "node:test";
import assert from "node:assert/strict";
import { couponUsageLockKeys, customerOrderLockKeys, withCouponUsageLocks } from "./coupon-checkout.ts";

function createKeyedLock() {
  const tails = new Map();
  return async (key) => {
    const previous = tails.get(key) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    tails.set(key, previous.then(() => current));
    await previous;
    return release;
  };
}

test("customer coupon locks normalize identities and use stable order", () => {
  assert.deepEqual(couponUsageLockKeys({ couponCode: " save10 ", userId: "u1", email: " A@Example.com " }), [
    "coupon:SAVE10:email:a@example.com",
    "coupon:SAVE10:user:u1",
  ]);
  assert.deepEqual(couponUsageLockKeys({ couponCode: "SAVE10" }), []);
});

test("all order paths share normalized customer-scoped keys independently of coupon code", () => {
  const identity = { userId: "u1", email: " A@Example.com " };
  const common = customerOrderLockKeys(identity);
  assert.deepEqual(common, ["order-customer:email:a@example.com", "order-customer:user:u1"]);
  const firstCoupon = [...common, ...couponUsageLockKeys({ ...identity, couponCode: "FIRST10" })].sort();
  const secondCoupon = [...customerOrderLockKeys(identity), ...couponUsageLockKeys({ ...identity, couponCode: "WELCOME" })].sort();
  const noCoupon = customerOrderLockKeys(identity);
  assert.ok(common.every((key) => firstCoupon.includes(key)));
  assert.ok(common.every((key) => secondCoupon.includes(key)));
  assert.ok(common.every((key) => noCoupon.includes(key)));
  assert.notDeepEqual(firstCoupon, secondCoupon, "coupon usage locks remain coupon-specific");
});

test("concurrent requests serialize a per-customer usage check and only one claims the final use", async () => {
  const lock = createKeyedLock();

  // Transaction-like test adapter; each operation holds the same identity lock
  // through the usage check and its simulated commit.
  const keys = couponUsageLockKeys({ couponCode: "SAVE10", userId: "u1", email: "a@example.com" });
  let usageCount = 0;
  async function claim() {
    let releases = [];
    try {
      return await withCouponUsageLocks(keys, async (key) => {
        const release = await lock(key);
        releases.push(release);
      }, async () => {
        if (usageCount >= 1) return false;
        await new Promise((resolve) => setTimeout(resolve, 5));
        usageCount += 1;
        return true;
      });
    } finally {
      releases.reverse().forEach((release) => release());
    }
  }
  assert.deepEqual(await Promise.all([claim(), claim()]), [true, false]);
  assert.equal(usageCount, 1);
});

test("different first-order coupons serialize on the same customer lock through order creation", async () => {
  const tails = new Map();
  let signalWaiter;
  const secondWaiting = new Promise((resolve) => { signalWaiter = resolve; });
  const acquire = async (key) => {
    const previous = tails.get(key) ?? Promise.resolve();
    if (tails.has(key)) signalWaiter();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    tails.set(key, previous.then(() => current));
    await previous;
    return release;
  };
  let orderCount = 0;
  let firstInside;
  const firstHasLock = new Promise((resolve) => { firstInside = resolve; });
  let allowFirstCommit;
  const firstCommit = new Promise((resolve) => { allowFirstCommit = resolve; });
  async function attempt(code, isFirst) {
    const keys = [...customerOrderLockKeys({ userId: "u-1", email: "buyer@example.test" }),
      ...couponUsageLockKeys({ couponCode: code, userId: "u-1", email: "buyer@example.test" })];
    const releases = [];
    try {
      return await withCouponUsageLocks(keys, async (key) => releases.push(await acquire(key)), async () => {
        if (orderCount > 0) return false;
        if (isFirst) { firstInside(); await firstCommit; }
        orderCount += 1;
        return true;
      });
    } finally {
      releases.reverse().forEach((release) => release());
    }
  }
  const first = attempt("FIRST10", true);
  await firstHasLock;
  const second = attempt("WELCOME", false);
  await secondWaiting;
  assert.equal(orderCount, 0, "the waiting checkout cannot pass first-order eligibility before the first transaction commits");
  allowFirstCommit();
  assert.deepEqual(await Promise.all([first, second]), [true, false]);
  assert.equal(orderCount, 1);
});
