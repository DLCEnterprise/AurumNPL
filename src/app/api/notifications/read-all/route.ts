import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── POST /api/notifications/read-all ────────────────────────────────────────

export async function POST() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data:  { readAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
