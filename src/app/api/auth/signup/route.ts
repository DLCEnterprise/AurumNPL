import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendAdminNotification, sendRegistrationConfirmationEmail } from '@/lib/email'
import { signAdminToken, generateNonce } from '@/lib/utils'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'

const SignUpSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  company: z.string().min(2, 'Company name must be at least 2 characters.'),
  phone: z.string().optional(),
  role: z.enum(['SELLER', 'BUYER']),
  // Optional investor fields (BUYER only)
  entityName:     z.string().optional(),
  signerTitle:    z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  investorType:   z.string().optional(),
  lienPosition:   z.string().optional(),
  loanStatusPref: z.string().optional(),
  mainObjective:  z.string().optional(),
})

export async function POST(req: NextRequest) {
  // Rate limit: 5 signups / hour per IP
  const rl = await rateLimit('signup', getIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  try {
    const body = await req.json()
    const parsed = SignUpSchema.safeParse(body)

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

    const { name, email, password, company, phone, role,
            entityName, signerTitle, yearsExperience, investorType,
            lienPosition, loanStatusPref, mainObjective } = parsed.data

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        company,
        phone: phone ?? null,
        role,
        approvalStatus: 'PENDING',
        ...(role === 'BUYER' && {
          entityName:      entityName ?? null,
          signerTitle:     signerTitle ?? null,
          yearsExperience: yearsExperience ?? null,
          investorType:    investorType ?? null,
          lienPosition:    lienPosition ?? null,
          loanStatusPref:  loanStatusPref ?? null,
          mainObjective:   mainObjective ?? null,
        }),
      },
    })

    // Build approve/reject tokens (each signed separately to prevent reuse)
    const nonce = generateNonce()
    const approveToken = await signAdminToken({ userId: user.id, action: 'approve', nonce })
    const rejectToken = await signAdminToken({ userId: user.id, action: 'reject', nonce: generateNonce() })

    const base = process.env.BASE_URL ?? 'http://localhost:3000'
    const approveUrl = `${base}/api/admin/approve-user?token=${approveToken}`
    const rejectUrl  = `${base}/api/admin/approve-user?token=${rejectToken}`

    // Persist tokens for replay-prevention
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.adminToken.createMany({
      data: [
        { token: approveToken, userId: user.id, expiresAt: sevenDays },
        { token: rejectToken,  userId: user.id, expiresAt: sevenDays },
      ],
    })

    // Non-blocking — signup succeeds even if email isn't configured
    sendAdminNotification({
      userName: name,
      userEmail: email,
      userCompany: company,
      userRole: role,
      signupAt: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      approveUrl,
      rejectUrl,
    }).catch((err) => console.error('[signup] admin notification failed:', err))

    sendRegistrationConfirmationEmail(email, name)
      .catch((err) => console.error('[signup] confirmation email failed:', err))

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[signup]', err)
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
