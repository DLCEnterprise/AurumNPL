import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verifyResetToken } from '@/lib/utils'

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
})

/** GET — verify token validity only (used on page load) */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''

  if (!token) {
    return NextResponse.json({ valid: false })
  }

  const payload = await verifyResetToken(token)
  if (!payload) {
    return NextResponse.json({ valid: false })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } })
  if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({ valid: true })
}

/** POST — apply new password */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ResetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        fieldErrors[key] = fieldErrors[key] ?? []
        fieldErrors[key].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: 'Validation failed.', fieldErrors },
        { status: 422 }
      )
    }

    const { token, password } = parsed.data

    // Verify JWT signature and expiry
    const payload = await verifyResetToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid or has expired.' },
        { status: 400 }
      )
    }

    // Look up DB record by hash — check not used and not expired
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } })
    if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This reset link is invalid or has already been used.' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 12)

    // Atomically update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payload.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
