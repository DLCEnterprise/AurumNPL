import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const UpdatePrefsSchema = z.object({
  newBidInApp:      z.boolean().optional(),
  newBidEmail:      z.boolean().optional(),
  bidAcceptedInApp: z.boolean().optional(),
  bidAcceptedEmail: z.boolean().optional(),
  bidRejectedInApp: z.boolean().optional(),
  bidRejectedEmail: z.boolean().optional(),
  newMessageInApp:  z.boolean().optional(),
  newMessageEmail:  z.boolean().optional(),
  digestFrequency:  z.enum(['instant', 'daily', 'weekly']).optional(),
})

// ─── GET /api/notifications/preferences ──────────────────────────────────────
export async function GET() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const prefs = await prisma.notificationPreference.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  })

  return NextResponse.json({ success: true, data: prefs })
}

// ─── PUT /api/notifications/preferences ──────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = UpdatePrefsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const prefs = await prisma.notificationPreference.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  })

  return NextResponse.json({ success: true, data: prefs })
}
