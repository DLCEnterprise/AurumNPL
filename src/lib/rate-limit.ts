/**
 * Rate limiter with two backends:
 *  - Upstash Redis (production, Vercel-compatible, serverless-safe)
 *  - In-memory LRU (development / single-instance fallback)
 *
 * Usage:
 *   const result = await rateLimit('signup', ip)
 *   if (!result.success) return 429
 */

/* ── Types ───────────────────────────────────────────────────────────────── */

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix ms
}

interface Window {
  requests: number
  resetAt: number
}

/* ── In-memory fallback (dev / single-instance) ──────────────────────────── */

const store = new Map<string, Window>()

// Remove expired windows every 5 minutes to prevent memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, win] of store.entries()) {
      if (win.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

function inMemoryLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const win = store.get(key)

  if (!win || win.resetAt < now) {
    store.set(key, { requests: 1, resetAt: now + windowMs })
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }

  win.requests += 1
  const remaining = Math.max(0, limit - win.requests)
  return {
    success: win.requests <= limit,
    limit,
    remaining,
    reset: win.resetAt,
  }
}

/* ── Upstash Redis backend (production) ─────────────────────────────────── */

async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url   = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!
  const now   = Date.now()
  // INCR + EXPIRE via pipeline
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, windowMs],
      ['PTTL', key],
    ]),
  })

  if (!res.ok) {
    // Redis unavailable — fail open (don't block legitimate traffic)
    return { success: true, limit, remaining: limit, reset: now + windowMs }
  }

  const [incrRes, , ttlRes] = await res.json() as Array<{ result: number }>
  const count = incrRes.result
  const ttl   = ttlRes.result > 0 ? ttlRes.result : windowMs

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset: now + ttl,
  }
}

/* ── Named limit configurations ─────────────────────────────────────────── */

const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  signup:  { limit: 5,   windowMs: 60 * 60 * 1000 },       // 5 / hour
  signin:  { limit: 10,  windowMs: 15 * 60 * 1000 },       // 10 / 15 min
  reset:   { limit: 3,   windowMs: 60 * 60 * 1000 },       // 3 / hour
  api:     { limit: 100, windowMs: 60 * 1000 },             // 100 / min
  admin:   { limit: 20,  windowMs: 60 * 1000 },             // 20 / min
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export async function rateLimit(
  type: keyof typeof LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const cfg = LIMITS[type] ?? LIMITS.api
  const key = `rl:${type}:${identifier}`

  const useUpstash =
    typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
    process.env.UPSTASH_REDIS_REST_URL.length > 0

  if (useUpstash) {
    return upstashLimit(key, cfg.limit, cfg.windowMs)
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[rate-limit] UPSTASH_REDIS_REST_URL is not set — falling back to in-memory rate limiter. ' +
      'Limits will NOT persist across serverless invocations. Set UPSTASH_REDIS_REST_URL and ' +
      'UPSTASH_REDIS_REST_TOKEN in your environment to enable persistent rate limiting.'
    )
  }
  return inMemoryLimit(key, cfg.limit, cfg.windowMs)
}

/** Extract IP from Next.js request headers */
export function getIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/** Return a 429 JSON response with Retry-After header */
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfterSec = Math.ceil((result.reset - Date.now()) / 1000)
  return new Response(
    JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
        'Retry-After': String(retryAfterSec),
      },
    }
  )
}
