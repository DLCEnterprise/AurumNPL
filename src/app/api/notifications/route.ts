import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── GET /api/notifications ───────────────────────────────────────────────────
// ?count=true → returns { count: number } of unread
// otherwise  → returns last 30 notifications

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const countOnly = searchParams.get('count') === 'true'

  if (countOnly) {
    const count = await prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    })
    return NextResponse.json({ success: true, data: { count } })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return NextResponse.json({ success: true, data: notifications })
}
