import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── GET /api/listings/saved ─────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const saved = await prisma.savedListing.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: { seller: { select: { id: true, name: true, company: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: saved })
}
