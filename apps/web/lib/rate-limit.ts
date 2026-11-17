/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Keyed by client identity (IP). This is intentionally dependency-free and
 * process-local: on a multi-instance serverless host (Vercel) each warm
 * instance keeps its own counters, so this is best-effort defense-in-depth
 * against bursts — NOT a distributed quota. For a hard global limit, back it
 * with a shared store (Vercel KV / Upstash Redis) behind the same interface.
 *
 * The real authorization boundary for live imports is `import-guard.ts`; this
 * only throttles how fast a caller can probe it.
 */

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets (for a Retry-After header). */
  retryAfterSec: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1, retryAfterSec: 0 };
  }

  if (existing.count >= opts.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: opts.limit - existing.count,
    retryAfterSec: 0,
  };
}

/** Test-only: clear all counters so cases don't leak into each other. */
export function __resetRateLimits(): void {
  buckets.clear();
}
