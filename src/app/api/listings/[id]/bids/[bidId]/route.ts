import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

type Params = { params: Promise<{ id: string; bidId: string }> }

const PatchSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'WITHDRAWN']),
})

// ─── PATCH /api/listings/[id]/bids/[bidId] ───────────────────────────────────

export async function PATCH(req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId, bidId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { listing: { select: { sellerId: true, title: true } } },
  })
  if (!bid || bid.listingId !== listingId) {
    return NextResponse.json({ success: false, error: 'Bid not found.' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
  }

  const { status } = parsed.data
  const userId    = session.user.id
  const isSeller  = bid.listing.sellerId === userId
  const isAdmin   = session.user.role === 'ADMIN'
  const isBidder  = bid.bidderId === userId

  // Permission check
  if (status === 'WITHDRAWN' && !isBidder && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Only the bidder may withdraw their bid.' }, { status: 403 })
  }
  if ((status === 'ACCEPTED' || status === 'REJECTED') && !isSeller && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Only the seller may accept or reject bids.' }, { status: 403 })
  }

  const updated = await prisma.bid.update({
    where: { id: bidId },
    data: { status },
  })

  // Notify bidder
  if (status === 'ACCEPTED') {
    createNotification({
      userId:  bid.bidderId,
      type:    'BID_ACCEPTED',
      title:   `Your bid on "${bid.listing.title}" was accepted`,
      linkUrl: `/listings/${listingId}`,
    }).catch(() => {})
  } else if (status === 'REJECTED') {
    createNotification({
      userId:  bid.bidderId,
      type:    'BID_REJECTED',
      title:   `Your bid on "${bid.listing.title}" was declined`,
      linkUrl: `/listings/${listingId}`,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, data: updated })
}
