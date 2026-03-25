import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// ─── PATCH /api/notifications/[id]/read ──────────────────────────────────────

export async function PATCH(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Not found.' }, { status: 404 })
  }

  const updated = await prisma.notification.update({
    where: { id },
    data:  { readAt: new Date() },
  })

  return NextResponse.json({ success: true, data: updated })
}
