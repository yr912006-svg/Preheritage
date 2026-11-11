export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();
  const { windowMs, max } = options;

  function prune() {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }

  return {
    check(key: string): RateLimitResult {
      prune();
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetAt <= now) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { success: true, remaining: max - 1, resetAt };
      }

      if (entry.count >= max) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count += 1;
      return { success: true, remaining: max - entry.count, resetAt: entry.resetAt };
    },
    reset(key?: string) {
      if (key) {
        store.delete(key);
      } else {
        store.clear();
      }
    },
    size(): number {
      prune();
      return store.size;
    },
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}
