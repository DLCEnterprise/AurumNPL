import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/listings/[id]/analytics ────────────────────────────────────────

export async function GET(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise

  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }

  const isOwner = listing.sellerId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalViews, viewsLast7Days, fingerprintGroups, bidCount, savedCount] =
    await Promise.all([
      prisma.listingView.count({ where: { listingId } }),
      prisma.listingView.count({
        where: { listingId, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.listingView.groupBy({
        by: ['fingerprint'],
        where: { listingId, fingerprint: { not: null } },
      }),
      prisma.bid.count({ where: { listingId } }),
      prisma.savedListing.count({ where: { listingId } }),
    ])

  return NextResponse.json({
    success: true,
    data: {
      totalViews,
      uniqueVisitors: fingerprintGroups.length,
      viewsLast7Days,
      bidCount,
      savedCount,
    },
  })
}
