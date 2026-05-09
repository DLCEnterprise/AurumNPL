import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'

/** Used by sign-in page to give specific error messages without exposing password hashes. */
export async function POST(req: NextRequest) {
  const rl = await rateLimit('signin', getIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  const { email } = await req.json()
  if (!email) return NextResponse.json({}, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
    select: { approvalStatus: true },
  })

  if (!user) return NextResponse.json({}, { status: 200 })

  return NextResponse.json({ approvalStatus: user.approvalStatus })
}
