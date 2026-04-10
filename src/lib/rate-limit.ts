/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding-window counter per IP address. Not shared across
 * serverless instances, but sufficient to stop casual abuse and bots.
 * For production-grade limiting consider an external store (Redis / Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Map<string, RateLimitEntry>>();

interface RateLimitOptions {
  /** Unique name for this limiter (e.g. "checkout", "contact") */
  key: string;
  /** Maximum requests allowed per window */
  limit: number;
  /** Window size in seconds (default 60) */
  windowSeconds?: number;
}

export function rateLimit(
  request: Request,
  opts: RateLimitOptions
): { limited: boolean; remaining: number } {
  const { key, limit, windowSeconds = 60 } = opts;
  const windowMs = windowSeconds * 1000;
  const now = Date.now();

  // Identify client by IP (forwarded header or fallback)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const bucketKey = `${key}:${ip}`;

  if (!buckets.has(key)) {
    buckets.set(key, new Map());
  }
  const bucket = buckets.get(key)!;

  const entry = bucket.get(bucketKey);

  if (!entry || now > entry.resetAt) {
    bucket.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { limited: true, remaining: 0 };
  }

  return { limited: false, remaining: limit - entry.count };
}

// Periodically prune expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [, bucket] of buckets) {
    for (const [key, entry] of bucket) {
      if (now > entry.resetAt) {
        bucket.delete(key);
      }
    }
  }
}, 60_000);
