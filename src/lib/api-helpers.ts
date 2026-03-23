import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'
import { rateLimit, rateLimitResponse } from './rate-limit'

/**
 * Guard a route handler: verify session + rate limit by user ID.
 * Returns the session on success, or a Response to return immediately on failure.
 */
export async function guardRoute(
  req: NextRequest,
  options: { requireApproved?: boolean } = {}
): Promise<
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof auth>>> }
  | { ok: false; response: NextResponse }
> {
  const session = await auth()

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { requireApproved = true } = options
  if (requireApproved && session.user.approvalStatus !== 'APPROVED') {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Account not approved.' }, { status: 403 }),
    }
  }

  // Rate limit: 100 API calls / minute per user
  const rl = await rateLimit('api', session.user.id)
  if (!rl.success) {
    return { ok: false, response: rateLimitResponse(rl) as unknown as NextResponse }
  }

  return { ok: true, session }
}
