import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { sendBidNotificationEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/listings/[id]/bids ─────────────────────────────────────────────

export async function GET(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }

  const isSeller = listing.sellerId === session.user.id
  const isAdmin  = session.user.role === 'ADMIN'

  const bids = await prisma.bid.findMany({
    where: {
      listingId,
      ...(isSeller || isAdmin ? {} : { bidderId: session.user.id }),
    },
    include: { bidder: { select: { id: true, name: true, company: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: bids })
}

// ─── POST /api/listings/[id]/bids ────────────────────────────────────────────

const BidSchema = z.object({
  amount:   z.number().positive(),
  noteRate: z.number().min(0).max(100).optional(),
  message:  z.string().max(2000).optional(),
})

export async function POST(req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'BUYER' && session.user.role !== 'SELLER_BUYER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Only buyers may submit bids.' }, { status: 403 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { seller: { select: { id: true, name: true, company: true, email: true } } },
  })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }
  if (listing.status !== 'ACTIVE') {
    return NextResponse.json({ success: false, error: 'Listing is not active.' }, { status: 422 })
  }
  if (listing.sellerId === session.user.id) {
    return NextResponse.json({ success: false, error: 'You cannot bid on your own listing.' }, { status: 403 })
  }

  // One active PENDING bid per buyer per listing
  const existing = await prisma.bid.findFirst({
    where: { listingId, bidderId: session.user.id, status: 'PENDING' },
  })
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'You already have a pending bid on this listing.' },
      { status: 422 }
    )
  }

  const body = await req.json()
  const parsed = BidSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const bid = await prisma.bid.create({
    data: {
      listingId,
      bidderId: session.user.id,
      amount:   parsed.data.amount,
      noteRate: parsed.data.noteRate,
      message:  parsed.data.message,
      expiresAt,
    },
    include: { bidder: { select: { id: true, name: true, company: true, email: true } } },
  })

  // Notify seller (fire and forget)
  createNotification({
    userId:  listing.sellerId,
    type:    'NEW_BID',
    title:   `New bid on "${listing.title}"`,
    linkUrl: `/listings/${listingId}/bids`,
  }).catch(() => {})

  sendBidNotificationEmail({
    to:           listing.seller.email,
    buyerCompany: session.user.company ?? session.user.name ?? 'A buyer',
    amount:       parsed.data.amount,
    listingTitle: listing.title,
    bidsUrl:      `${process.env.BASE_URL ?? 'http://localhost:3000'}/listings/${listingId}/bids`,
  }).catch(() => {})

  return NextResponse.json({ success: true, data: bid }, { status: 201 })
}
