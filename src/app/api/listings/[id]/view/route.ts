import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// ─── POST /api/listings/[id]/view ────────────────────────────────────────────

export async function POST(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise

  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: true }) // silently succeed for unauthed
  }

  const userId = session.user.id

  // Don't count the seller's own views
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  })
  if (!listing) {
    return NextResponse.json({ success: true })
  }
  if (listing.sellerId === userId) {
    return NextResponse.json({ success: true })
  }

  // Dedup: one fingerprint per user per calendar day
  const fingerprint = Buffer.from(
    `${listingId}:${userId}:${new Date().toDateString()}`
  ).toString('base64')

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const existing = await prisma.listingView.findFirst({
    where: {
      listingId,
      fingerprint,
      createdAt: { gte: oneHourAgo },
    },
  })
  if (existing) {
    return NextResponse.json({ success: true })
  }

  await prisma.listingView.create({
    data: { listingId, fingerprint },
  })

  return NextResponse.json({ success: true })
}
