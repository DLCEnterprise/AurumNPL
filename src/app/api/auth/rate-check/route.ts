import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'

/**
 * POST /api/auth/rate-check
 * Lightweight pre-flight check used by the sign-in page to surface
 * rate-limit errors with a human-readable message before NextAuth
 * swallows the 429 response.
 */
export async function POST(req: NextRequest) {
  const ip     = getIp(req)
  const result = await rateLimit('signin', ip)
  if (!result.success) return rateLimitResponse(result)
  return new Response(null, { status: 204 })
}
