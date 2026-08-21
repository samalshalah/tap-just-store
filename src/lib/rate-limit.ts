import "server-only";

/**
 * A sliding-window limiter held in process memory.
 *
 * Honest about what it is: on Cloudflare Workers each isolate has its own
 * memory, so this is a per-isolate limit, not a global one. It still turns an
 * unbounded flood into a bounded one per isolate, and it costs nothing. Where a
 * hard global limit matters — the admin login — this sits in front of a
 * database-backed counter rather than replacing it.
 *
 * Entries are pruned on read, so an idle key disappears rather than leaking.
 */

interface Bucket {
  hits: number[];
}

const BUCKETS = new Map<string, Bucket>();

/** Stop the map growing without bound if someone rotates keys at us. */
const MAX_KEYS = 5000;

export interface RateLimitResult {
  ok: boolean;
  /** Attempts left in the current window. */
  remaining: number;
  /** Seconds until the window frees up. Zero when ok. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (BUCKETS.size > MAX_KEYS) BUCKETS.clear();

  const bucket = BUCKETS.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    BUCKETS.set(key, bucket);
    const oldest = bucket.hits[0];
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  BUCKETS.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfter: 0 };
}

/**
 * Best-effort client address.
 *
 * Behind Cloudflare, CF-Connecting-IP is set by the edge and cannot be spoofed
 * by the client. X-Forwarded-For can be, so it is only a fallback for local
 * development. An unknown address falls into one shared bucket, which is
 * deliberately strict rather than permissive.
 */
export function clientKey(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** The 429 every limited route should return, with the standard header. */
export function tooManyRequests(retryAfter: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
    },
  });
}
