import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { sendBidAcceptedEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string; bidId: string }> }

const PatchSchema = z.object({
  status:        z.enum(['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COUNTERED']),
  counterAmount: z.number().positive().optional(),
  counterNote:   z.string().max(2000).optional(),
  amount:        z.number().positive().optional(),
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
    include: {
      listing: { select: { sellerId: true, title: true, dropboxLink: true } },
      bidder:  { select: { id: true, email: true, name: true } },
    },
  })
  if (!bid || bid.listingId !== listingId) {
    return NextResponse.json({ success: false, error: 'Bid not found.' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
  }

  const { status, counterAmount, counterNote, amount } = parsed.data
  const userId   = session.user.id
  const isSeller = bid.listing.sellerId === userId
  const isAdmin  = session.user.role === 'ADMIN'
  const isBidder = bid.bidderId === userId

  if (status === 'WITHDRAWN' && !isBidder && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Only the bidder may withdraw their bid.' }, { status: 403 })
  }
  const isRespondingToCounter = isBidder && bid.status === 'COUNTERED' && (status === 'ACCEPTED' || status === 'REJECTED')
  if ((status === 'ACCEPTED' || status === 'REJECTED' || status === 'COUNTERED') && !isSeller && !isAdmin && !isRespondingToCounter) {
    return NextResponse.json({ success: false, error: 'Only the seller may accept, reject, or counter bids.' }, { status: 403 })
  }

  if ((status === 'ACCEPTED' || status === 'REJECTED') && bid.expiresAt && bid.expiresAt < new Date()) {
    return NextResponse.json({ success: false, error: 'This bid has expired.' }, { status: 409 })
  }

  const bidData = status === 'COUNTERED'
    ? { status, counterAmount, counterNote }
    : status === 'ACCEPTED' && amount != null
      ? { status, amount }
      : { status }

  let updated
  if (status === 'ACCEPTED') {
    // All changes happen atomically: update bid, advance listing status,
    // reject competing bids, and create the DD timeline.
    const now = new Date()
    const bpoOeDeadline = new Date(now.getTime() + 5  * 24 * 60 * 60 * 1000)
    const ddDeadline    = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000)

    const [updatedBid] = await prisma.$transaction([
      // Accept the winning bid
      prisma.bid.update({ where: { id: bidId }, data: bidData }),

      // Reject all other PENDING bids on this listing
      prisma.bid.updateMany({
        where: { listingId, id: { not: bidId }, status: 'PENDING' },
        data:  { status: 'REJECTED' },
      }),

      // Advance listing to OFFER_ACCEPTED
      prisma.listing.update({
        where: { id: listingId },
        data:  { status: 'OFFER_ACCEPTED' },
      }),

      // Create the due diligence timeline
      prisma.dueDiligenceTimeline.create({
        data: {
          listingId,
          bidId,
          buyerId:       bid.bidder.id,
          bidAcceptedAt: now,
          bpoOeDeadline,
          ddDeadline,
        },
      }),
    ])
    updated = updatedBid
  } else {
    updated = await prisma.bid.update({ where: { id: bidId }, data: bidData })
  }

  // ── Notifications (fire-and-forget) ─────────────────────────────────────────
  if (status === 'ACCEPTED') {
    createNotification({
      userId:  bid.bidderId,
      type:    'BID_ACCEPTED',
      title:   `Your bid on "${bid.listing.title}" was accepted`,
      linkUrl: `/listings/${listingId}`,
    }).catch(() => {})

    if (bid.bidder?.email) {
      sendBidAcceptedEmail({
        to:           bid.bidder.email,
        buyerName:    bid.bidder.name ?? 'Buyer',
        listingTitle: bid.listing.title,
        amount:       amount ?? bid.amount,
        dropboxLink:  bid.listing.dropboxLink ?? undefined,
        listingUrl:   `${process.env.BASE_URL ?? 'http://localhost:3000'}/listings/${listingId}`,
      }).catch(() => {})
    }
  } else if (status === 'REJECTED') {
    createNotification({
      userId:  bid.bidderId,
      type:    'BID_REJECTED',
      title:   `Your bid on "${bid.listing.title}" was declined`,
      linkUrl: `/listings/${listingId}`,
    }).catch(() => {})
  } else if (status === 'COUNTERED') {
    createNotification({
      userId:  bid.bidderId,
      type:    'COUNTER_OFFER',
      title:   `You received a counter offer on "${bid.listing.title}"`,
      linkUrl: `/listings/${listingId}`,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, data: updated })
}
