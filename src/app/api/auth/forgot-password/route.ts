import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { signResetToken, generateNonce } from '@/lib/utils'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address.'),
})

export async function POST(req: NextRequest) {
  // Rate limit: 3 reset requests / hour per IP
  const rl = await rateLimit('reset', getIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  try {
    const body = await req.json()
    const parsed = ForgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address.' },
        { status: 422 }
      )
    }

    const { email } = parsed.data

    // Look up user — always return 200 to avoid revealing account existence
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const nonce = generateNonce()
    const token = await signResetToken({ userId: user.id, nonce })
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Persist token
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    // Build reset URL and send email (non-blocking)
    const base = process.env.BASE_URL ?? 'http://localhost:3000'
    const resetUrl = `${base}/reset-password?token=${token}`

    sendPasswordResetEmail(user.email, resetUrl)
      .catch((err) => console.error('[forgot-password] email failed:', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
