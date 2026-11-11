import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  prefix?: string;
  store?: RateLimitStore;
  redis?: any;
  upstashUrl?: string;
  upstashToken?: string;
  fallbackBehavior?: "fail-closed" | "in-memory";
  isHosted?: boolean;
  env?: Record<string, string | undefined>;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitStore {
  limit(key: string, max: number, windowMs: number): Promise<RateLimitResult> | RateLimitResult;
  reset?(key?: string): Promise<void> | void;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
  reset(key?: string): Promise<void> | void;
  isDistributed(): boolean;
}

function formatWindow(ms: number): `${number} ms` | `${number} s` | `${number} m` {
  if (ms % 60000 === 0) return `${ms / 60000} m`;
  if (ms % 1000 === 0) return `${ms / 1000} s`;
  return `${ms} ms`;
}

/**
 * Shared memory store for local development, fallback resilience,
 * and testing multi-instance concurrency without external network dependencies.
 */
export function createSharedMemoryStore(): RateLimitStore {
  const store = new Map<string, { count: number; resetAt: number }>();

  function prune(now: number) {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }

  return {
    limit(key: string, max: number, windowMs: number): RateLimitResult {
      const now = Date.now();
      prune(now);
      const entry = store.get(key);

      if (!entry || entry.resetAt <= now) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { success: true, remaining: Math.max(0, max - 1), resetAt };
      }

      if (entry.count >= max) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count += 1;
      return { success: true, remaining: Math.max(0, max - entry.count), resetAt: entry.resetAt };
    },
    reset(key?: string) {
      if (key) store.delete(key);
      else store.clear();
    },
  };
}

export function isHostedEnvironment(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL === "1" || env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "production";
}

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const { windowMs, max, prefix = "default" } = options;
  const fallbackStore = createSharedMemoryStore();

  const env = options.env || process.env;
  const isHosted = typeof options.isHosted === "boolean" ? options.isHosted : isHostedEnvironment(env);

  const rawUrl = options.upstashUrl ?? env.UPSTASH_REDIS_REST_URL;
  const rawToken = options.upstashToken ?? env.UPSTASH_REDIS_REST_TOKEN;
  const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  const hasValidCredentials = url.length > 0 && token.length > 0;

  const fallbackBehavior = options.fallbackBehavior ?? "fail-closed";

  // Hosted environments (Vercel Preview / Production) require valid Upstash credentials.
  // Missing credentials in hosted environments MUST fail closed to prevent silent local-memory bypass.
  if (isHosted && !options.store && !options.redis && !hasValidCredentials) {
    console.warn(
      "[RateLimit] Upstash Redis credentials missing in hosted environment — failing closed to prevent distributed abuse"
    );
    return {
      async check(_key: string): Promise<RateLimitResult> {
        return {
          success: false,
          remaining: 0,
          resetAt: Date.now() + windowMs,
        };
      },
      async reset(_key?: string) {},
      isDistributed(): boolean {
        return false;
      },
    };
  }

  let upstashLimiter: { limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }> } | null = null;

  if (options.store) {
    // Custom or shared test store provided
    return {
      async check(key: string): Promise<RateLimitResult> {
        try {
          const namespacedKey = `${prefix}:${key}`;
          return await options.store!.limit(namespacedKey, max, windowMs);
        } catch (err) {
          if (fallbackBehavior === "fail-closed" || isHosted) {
            return {
              success: false,
              remaining: 0,
              resetAt: Date.now() + windowMs,
            };
          }
          return fallbackStore.limit(`${prefix}:${key}`, max, windowMs);
        }
      },
      async reset(key?: string) {
        if (options.store?.reset) await options.store.reset(key ? `${prefix}:${key}` : undefined);
      },
      isDistributed(): boolean {
        return true;
      },
    };
  }

  if (options.redis) {
    try {
      upstashLimiter = new Ratelimit({
        redis: options.redis,
        limiter: Ratelimit.slidingWindow(max, formatWindow(windowMs)),
        analytics: false,
        prefix: `preheritage:rl:${prefix}`,
      });
    } catch (e) {
      console.warn("[RateLimit] Custom Redis initialization warning:", e instanceof Error ? e.name : "init_error");
    }
  } else if (hasValidCredentials) {
    try {
      const redis = new Redis({
        url,
        token,
      });
      upstashLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, formatWindow(windowMs)),
        analytics: false,
        prefix: `preheritage:rl:${prefix}`,
      });
    } catch (e) {
      console.warn("[RateLimit] Upstash Redis initialization warning:", e instanceof Error ? e.name : "init_error");
    }
  }

  return {
    async check(key: string): Promise<RateLimitResult> {
      if (upstashLimiter) {
        try {
          const res = await upstashLimiter.limit(key);
          return {
            success: res.success,
            remaining: res.remaining,
            resetAt: res.reset,
          };
        } catch (err) {
          console.warn(
            "[RateLimit] Distributed store unavailable:",
            err instanceof Error ? err.name : "error",
            `— ${fallbackBehavior === "fail-closed" || isHosted ? "failing closed to prevent distributed abuse" : "enforcing local container rate limiter"}`
          );
          if (fallbackBehavior === "fail-closed" || isHosted) {
            return {
              success: false,
              remaining: 0,
              resetAt: Date.now() + windowMs,
            };
          }
          return fallbackStore.limit(`${prefix}:${key}`, max, windowMs);
        }
      }

      // If Upstash is not configured:
      // In hosted environments, fail closed (never silently use container memory)
      if (isHosted) {
        console.warn("[RateLimit] Unconfigured distributed store in hosted environment — failing closed");
        return {
          success: false,
          remaining: 0,
          resetAt: Date.now() + windowMs,
        };
      }

      // Allow local container memory fallback ONLY in explicitly unhosted local development / test environments
      return fallbackStore.limit(`${prefix}:${key}`, max, windowMs);
    },
    async reset(key?: string) {
      fallbackStore.reset?.(key ? `${prefix}:${key}` : undefined);
    },
    isDistributed(): boolean {
      return upstashLimiter !== null;
    },
  };
}

/**
 * Extracts and sanitizes the authentic client IP address from trusted edge headers.
 * Prioritizes x-real-ip (set and sanitized by Vercel edge routers) to prevent
 * arbitrary spoofing via client-crafted X-Forwarded-For headers.
 */
export function getClientIp(req: Request): string {
  // 1. Trust x-real-ip first (overwritten and sanitized by Vercel's edge network)
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  // 2. Trust x-vercel-ip if provided by Vercel edge
  const vercelIp = req.headers.get("x-vercel-ip");
  if (vercelIp && vercelIp.trim().length > 0) {
    return vercelIp.trim();
  }

  // 3. Fallback to nearest proxy hop from x-forwarded-for (last IP appended by trusted ingress)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    if (hops.length > 0) {
      return hops[hops.length - 1];
    }
  }

  return "127.0.0.1";
}
