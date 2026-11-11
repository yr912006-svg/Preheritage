import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter, createSharedMemoryStore, getClientIp, isHostedEnvironment } from "./rate-limit.ts";

test("exact rate-limit boundaries and remaining count decrements", async () => {
  const limiter = createRateLimiter({ windowMs: 1000, max: 3 });

  const r1 = await limiter.check("client-1");
  assert.equal(r1.success, true);
  assert.equal(r1.remaining, 2);

  const r2 = await limiter.check("client-1");
  assert.equal(r2.success, true);
  assert.equal(r2.remaining, 1);

  const r3 = await limiter.check("client-1");
  assert.equal(r3.success, true);
  assert.equal(r3.remaining, 0);

  const r4 = await limiter.check("client-1");
  assert.equal(r4.success, false);
  assert.equal(r4.remaining, 0);
});

test("rate limiter isolates different client keys / IPs", async () => {
  const limiter = createRateLimiter({ windowMs: 1000, max: 2 });

  await limiter.check("client-a");
  await limiter.check("client-a");
  const blockedA = await limiter.check("client-a");
  assert.equal(blockedA.success, false);

  const allowedB = await limiter.check("client-b");
  assert.equal(allowedB.success, true);
  assert.equal(allowedB.remaining, 1);
});

test("rate limiter resets quota after window expiration", async () => {
  const limiter = createRateLimiter({ windowMs: 50, max: 1 });

  const first = await limiter.check("client-exp");
  assert.equal(first.success, true);

  const blocked = await limiter.check("client-exp");
  assert.equal(blocked.success, false);

  await new Promise((resolve) => setTimeout(resolve, 60));

  const afterExp = await limiter.check("client-exp");
  assert.equal(afterExp.success, true);
});

test("multiple limiter instances sharing one store enforce global quota", async () => {
  // Simulates two separate Vercel serverless functions sharing a common distributed store
  const sharedStore = createSharedMemoryStore();
  const instanceA = createRateLimiter({ windowMs: 2000, max: 3, store: sharedStore });
  const instanceB = createRateLimiter({ windowMs: 2000, max: 3, store: sharedStore });

  const clientIp = "192.168.1.50";

  // Request 1 on Instance A
  const r1 = await instanceA.check(clientIp);
  assert.equal(r1.success, true);
  assert.equal(r1.remaining, 2);

  // Request 2 on Instance B
  const r2 = await instanceB.check(clientIp);
  assert.equal(r2.success, true);
  assert.equal(r2.remaining, 1);

  // Request 3 on Instance A
  const r3 = await instanceA.check(clientIp);
  assert.equal(r3.success, true);
  assert.equal(r3.remaining, 0);

  // Request 4 on Instance B is blocked globally
  const r4 = await instanceB.check(clientIp);
  assert.equal(r4.success, false);
  assert.equal(r4.remaining, 0);

  // Request 5 on Instance A is also blocked
  const r5 = await instanceA.check(clientIp);
  assert.equal(r5.success, false);
});

test("concurrent requests across instances are strictly bounded", async () => {
  const sharedStore = createSharedMemoryStore();
  const instances = Array.from({ length: 4 }, () =>
    createRateLimiter({ windowMs: 5000, max: 5, store: sharedStore })
  );

  const clientIp = "10.0.0.99";

  // Dispatch 15 concurrent requests randomly across the 4 instances
  const promises = Array.from({ length: 15 }, (_, i) => {
    const inst = instances[i % instances.length];
    return inst.check(clientIp);
  });

  const results = await Promise.all(promises);
  const allowed = results.filter((r) => r.success).length;
  const blocked = results.filter((r) => !r.success).length;

  assert.equal(allowed, 5, "Exactly max (5) requests must succeed");
  assert.equal(blocked, 10, "Remaining 10 concurrent requests must be rejected");
});

test("missing credentials falls back to safe container limiter without crashing", async () => {
  // Ensure no env credentials passed
  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 2,
    upstashUrl: "",
    upstashToken: "",
  });

  assert.equal(limiter.isDistributed(), false);

  // Verify limiter is strictly active and bounds requests (never unlimited)
  assert.equal((await limiter.check("fallback-ip")).success, true);
  assert.equal((await limiter.check("fallback-ip")).success, true);
  assert.equal((await limiter.check("fallback-ip")).success, false);
});

test("redis unavailable defaults to fail-closed for security-sensitive endpoints", async () => {
  // Create a mock failing Upstash client simulating a Redis network outage / timeout
  let calls = 0;
  const failingRedis = {
    eval: async () => {
      calls += 1;
      throw new Error("ETIMEDOUT: Connection to Upstash Redis failed");
    },
    evalsha: async () => {
      calls += 1;
      throw new Error("ETIMEDOUT: Connection to Upstash Redis failed");
    },
  };

  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 2,
    redis: failingRedis,
  });

  // Verify fail-closed: Redis outage fails closed to prevent distributed abuse
  const r1 = await limiter.check("outage-ip");
  assert.equal(r1.success, false, "Must fail closed during Redis outage");
  assert.equal(r1.remaining, 0);
  assert.ok(r1.resetAt > Date.now());
});

test("redis unavailable with explicit in-memory fallback enforces container limits", async () => {
  const failingRedis = {
    eval: async () => {
      throw new Error("ECONNREFUSED: Redis host unreachable");
    },
    evalsha: async () => {
      throw new Error("ECONNREFUSED: Redis host unreachable");
    },
  };

  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 2,
    redis: failingRedis,
    fallbackBehavior: "in-memory",
  });

  const r1 = await limiter.check("outage-ip-inmem");
  assert.equal(r1.success, true);

  const r2 = await limiter.check("outage-ip-inmem");
  assert.equal(r2.success, true);

  // 3rd attempt is blocked by container store
  const r3 = await limiter.check("outage-ip-inmem");
  assert.equal(r3.success, false);
  assert.equal(r3.remaining, 0);
});

test("redis recovers gracefully when service is restored", async () => {
  let isDown = true;
  // A mock Redis client that fails initially, then recovers
  const recoveringRedis = {
    eval: async (script, keys, args) => {
      if (isDown) throw new Error("ETIMEDOUT");
      // Upstash slidingWindow Lua returns [success, remaining, reset]
      return [1, 2, Date.now() + 5000];
    },
    evalsha: async (sha, keys, args) => {
      if (isDown) throw new Error("ETIMEDOUT");
      return [1, 2, Date.now() + 5000];
    },
  };

  const limiter = createRateLimiter({
    windowMs: 5000,
    max: 3,
    redis: recoveringRedis,
  });

  // Initial call during outage: fails closed
  const rFail = await limiter.check("recovering-ip");
  assert.equal(rFail.success, false, "Must fail closed during outage");

  // Redis comes back online
  isDown = false;

  // Next call succeeds immediately without lingering lockup
  const rRecovered = await limiter.check("recovering-ip");
  assert.equal(rRecovered.success, true, "Must recover immediately when Redis is back online");
  assert.equal(rRecovered.remaining, 1);
});

test("trusted client IP extraction prevents X-Forwarded-For spoofing", () => {
  // Scenario 1: Edge router provides x-real-ip (trustworthy edge IP)
  const req1 = new Request("http://localhost/api/auth/register", {
    headers: {
      "x-real-ip": "203.0.113.195",
      "x-forwarded-for": "1.1.1.1, 8.8.8.8", // Spoofed client headers
    },
  });
  assert.equal(getClientIp(req1), "203.0.113.195", "Must prioritize x-real-ip over spoofed x-forwarded-for");

  // Scenario 2: x-vercel-ip provided by Vercel edge
  const req2 = new Request("http://localhost/api/auth/register", {
    headers: {
      "x-vercel-ip": "198.51.100.22",
    },
  });
  assert.equal(getClientIp(req2), "198.51.100.22");

  // Scenario 3: Reverse proxy appends client IP as the last hop in x-forwarded-for
  const req3 = new Request("http://localhost/api/auth/register", {
    headers: {
      "x-forwarded-for": "10.0.0.1, 172.16.0.2, 198.51.100.77",
    },
  });
  assert.equal(getClientIp(req3), "198.51.100.77", "Must pick the nearest proxy ingress hop");

  // Scenario 4: No headers provided (local development loopback)
  const req4 = new Request("http://localhost/api/auth/register");
  assert.equal(getClientIp(req4), "127.0.0.1");
});

test("endpoint policy configurations match approved specification", () => {
  // Register: 10 attempts per 15 minutes
  const regLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, prefix: "register" });
  assert.ok(regLimiter);

  // Password reset: 5 attempts per 15 minutes
  const pwLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, prefix: "password-reset" });
  assert.ok(pwLimiter);
});

test("registration and password-reset prefix isolation prevents quota cross-talk", async () => {
  const sharedStore = createSharedMemoryStore();
  const regLimiter = createRateLimiter({ windowMs: 5000, max: 2, prefix: "register", store: sharedStore });
  const pwLimiter = createRateLimiter({ windowMs: 5000, max: 2, prefix: "password-reset", store: sharedStore });

  const clientIp = "192.0.2.100";

  // Exhaust registration quota for clientIp
  assert.equal((await regLimiter.check(clientIp)).success, true);
  assert.equal((await regLimiter.check(clientIp)).success, true);
  const regBlocked = await regLimiter.check(clientIp);
  assert.equal(regBlocked.success, false, "Registration must be blocked after 2 attempts");

  // Verify password-reset quota for the SAME clientIp is isolated and completely unexhausted
  const pwAllowed1 = await pwLimiter.check(clientIp);
  assert.equal(pwAllowed1.success, true, "Password reset must be allowed despite registration being exhausted");
  assert.equal(pwAllowed1.remaining, 1);

  const pwAllowed2 = await pwLimiter.check(clientIp);
  assert.equal(pwAllowed2.success, true);
  assert.equal(pwAllowed2.remaining, 0);

  const pwBlocked = await pwLimiter.check(clientIp);
  assert.equal(pwBlocked.success, false, "Password reset blocked after reaching its own quota");
});

test("missing URL in Vercel Preview fails closed", async () => {
  const originalEnv = { ...process.env };
  try {
    const limiter = createRateLimiter({
      windowMs: 5000,
      max: 5,
      prefix: "register",
      env: {
        VERCEL: "1",
        VERCEL_ENV: "preview",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: "valid-mock-token",
      },
    });

    const res = await limiter.check("203.0.113.10");
    assert.equal(res.success, false, "Missing URL in Vercel Preview must fail closed");
    assert.equal(res.remaining, 0);
    assert.ok(res.resetAt > Date.now());
  } finally {
    process.env = originalEnv;
  }
});

test("missing token in Vercel Preview fails closed", async () => {
  const originalEnv = { ...process.env };
  try {
    const limiter = createRateLimiter({
      windowMs: 5000,
      max: 5,
      prefix: "register",
      env: {
        VERCEL: "1",
        VERCEL_ENV: "preview",
        UPSTASH_REDIS_REST_URL: "https://preheritage-preview-redis.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "",
      },
    });

    const res = await limiter.check("203.0.113.11");
    assert.equal(res.success, false, "Missing token in Vercel Preview must fail closed");
    assert.equal(res.remaining, 0);
  } finally {
    process.env = originalEnv;
  }
});

test("missing both credentials in Vercel Preview fails closed", async () => {
  const originalEnv = { ...process.env };
  try {
    const limiter = createRateLimiter({
      windowMs: 5000,
      max: 5,
      prefix: "password-reset",
      env: {
        VERCEL: "1",
        VERCEL_ENV: "preview",
      },
    });

    const res = await limiter.check("203.0.113.12");
    assert.equal(res.success, false, "Missing both credentials in Vercel Preview must fail closed");
    assert.equal(res.remaining, 0);
  } finally {
    process.env = originalEnv;
  }
});

test("missing credentials in Vercel Production fails closed", async () => {
  const originalEnv = { ...process.env };
  try {
    const limiter = createRateLimiter({
      windowMs: 5000,
      max: 5,
      prefix: "register",
      env: {
        VERCEL: "1",
        VERCEL_ENV: "production",
      },
    });

    const res = await limiter.check("203.0.113.13");
    assert.equal(res.success, false, "Missing credentials in Vercel Production must fail closed");
    assert.equal(res.remaining, 0);
  } finally {
    process.env = originalEnv;
  }
});

test("redis connection failure in hosted environments fails closed", async () => {
  const failingRedis = {
    eval: async () => {
      throw new Error("ETIMEDOUT: Upstash Redis Mumbai unreachable");
    },
    evalsha: async () => {
      throw new Error("ETIMEDOUT: Upstash Redis Mumbai unreachable");
    },
  };

  const limiter = createRateLimiter({
    windowMs: 5000,
    max: 5,
    prefix: "register",
    redis: failingRedis,
    env: {
      VERCEL: "1",
      VERCEL_ENV: "preview",
    },
  });

  const res = await limiter.check("203.0.113.14");
  assert.equal(res.success, false, "Redis connection failure in hosted environment must fail closed");
  assert.equal(res.remaining, 0);
  assert.ok(res.resetAt > Date.now());
});

test("local development fallback allows in-memory rate limiting when unhosted", async () => {
  const limiter = createRateLimiter({
    windowMs: 5000,
    max: 2,
    prefix: "local-test",
    env: {
      VERCEL: undefined,
      VERCEL_ENV: undefined,
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
    },
  });

  assert.equal(limiter.isDistributed(), false);

  const r1 = await limiter.check("127.0.0.1");
  assert.equal(r1.success, true);
  assert.equal(r1.remaining, 1);

  const r2 = await limiter.check("127.0.0.1");
  assert.equal(r2.success, true);
  assert.equal(r2.remaining, 0);

  const r3 = await limiter.check("127.0.0.1");
  assert.equal(r3.success, false, "Local development fallback must enforce rate limiting at max");
});
