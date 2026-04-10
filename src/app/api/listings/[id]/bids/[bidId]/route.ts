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
      listing: { select: { sellerId: true, title: true } },
      bidder: { select: { email: true, name: true } },
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

  // Permission check
  if (status === 'WITHDRAWN' && !isBidder && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Only the bidder may withdraw their bid.' }, { status: 403 })
  }
  // Bidder may accept or reject a counter offer (bid is currently COUNTERED)
  const isRespondingToCounter = isBidder && bid.status === 'COUNTERED' && (status === 'ACCEPTED' || status === 'REJECTED')
  if ((status === 'ACCEPTED' || status === 'REJECTED' || status === 'COUNTERED') && !isSeller && !isAdmin && !isRespondingToCounter) {
    return NextResponse.json({ success: false, error: 'Only the seller may accept, reject, or counter bids.' }, { status: 403 })
  }

  // Expiry check for terminal status changes by seller
  if (status === 'ACCEPTED' || status === 'REJECTED') {
    if (bid.expiresAt && bid.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'This bid has expired.' }, { status: 409 })
    }
  }

  const updated = await prisma.bid.update({
    where: { id: bidId },
    data: status === 'COUNTERED'
      ? { status, counterAmount, counterNote }
      : status === 'ACCEPTED' && amount != null
        ? { status, amount }
        : { status },
  })

  // Notifications
  if (status === 'ACCEPTED') {
    createNotification({
      userId:  bid.bidderId,
      type:    'BID_ACCEPTED',
      title:   `Your bid on "${bid.listing.title}" was accepted`,
      linkUrl: `/listings/${listingId}`,
    }).catch(() => {})

    // Send bid accepted email with dropbox link if available
    const listingWithDropbox = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, dropboxLink: true },
    })
    if (bid.bidder?.email) {
      sendBidAcceptedEmail({
        to:           bid.bidder.email,
        buyerName:    bid.bidder.name ?? 'Buyer',
        listingTitle: listingWithDropbox?.title ?? bid.listing.title,
        amount:       amount ?? bid.amount,
        dropboxLink:  listingWithDropbox?.dropboxLink,
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
