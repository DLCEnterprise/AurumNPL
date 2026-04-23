import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export async function GET(_req: Request, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch timeline base record
  const timeline = await prisma.dueDiligenceTimeline.findUnique({ where: { id } })
  if (!timeline) return NextResponse.json({ success: false, error: 'Not found.' }, { status: 404 })

  const isSeller = await prisma.listing.findFirst({ where: { id: timeline.listingId, sellerId: session.user.id } })
  const isBuyer  = timeline.buyerId === session.user.id
  const isAdmin  = session.user.role === 'ADMIN'
  if (!isSeller && !isBuyer && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  // Fetch related records separately to avoid Prisma generated-client relation issues
  const [listing, bid, buyer] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: timeline.listingId },
      include: {
        seller: { select: { name: true, company: true, email: true } },
        asset:  { select: { propertyStreet: true, propertyCity: true, propertyState: true, propertyZip: true } },
      },
    }),
    prisma.bid.findUnique({
      where: { id: timeline.bidId },
      select: { amount: true, noteRate: true, offerNumber: true },
    }),
    prisma.user.findUnique({
      where: { id: timeline.buyerId },
      select: { name: true, company: true, email: true },
    }),
  ])

  if (!listing || !bid || !buyer) {
    return NextResponse.json({ success: false, error: 'Deal data incomplete.' }, { status: 500 })
  }

  const template = await prisma.mlpaTemplate.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } })
  if (!template) return NextResponse.json({ success: false, error: 'No active MLPA template found. Ask your admin to configure one.' }, { status: 404 })

  const asset = listing.asset
  const address = [asset?.propertyStreet, asset?.propertyCity, asset?.propertyState, asset?.propertyZip].filter(Boolean).join(', ') || 'N/A'
  const closingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const tokens: Record<string, string> = {
    BUYER_NAME:        buyer.name ?? 'N/A',
    BUYER_COMPANY:     buyer.company ?? buyer.name ?? 'N/A',
    BUYER_EMAIL:       buyer.email ?? 'N/A',
    SELLER_NAME:       listing.seller.name ?? 'N/A',
    SELLER_COMPANY:    listing.seller.company ?? listing.seller.name ?? 'N/A',
    SELLER_EMAIL:      listing.seller.email ?? 'N/A',
    LISTING_TITLE:     listing.title,
    LISTING_NUMBER:    (listing as { listingNumber?: string | null }).listingNumber ?? 'N/A',
    OFFER_NUMBER:      bid.offerNumber ?? 'N/A',
    PROPERTY_ADDRESS:  address,
    OFFER_AMOUNT:      fmtCurrency(bid.amount),
    NOTE_RATE:         bid.noteRate != null ? `${bid.noteRate}%` : 'N/A',
    UPB:               listing.unpaidBalance != null ? fmtCurrency(listing.unpaidBalance) : 'N/A',
    DATE:              fmtDate(new Date()),
    CLOSING_DATE:      fmtDate(closingDate),
    BID_ACCEPTED_DATE: fmtDate(timeline.bidAcceptedAt),
  }

  let body = template.body
  for (const [key, value] of Object.entries(tokens)) {
    body = body.replaceAll(`{{${key}}}`, value)
  }

  return NextResponse.json({ success: true, data: { body, version: template.version, tokens } })
}
