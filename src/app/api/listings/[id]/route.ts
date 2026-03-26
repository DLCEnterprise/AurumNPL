import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/listings/[id] ───────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { id: true, name: true, company: true, email: true } } },
  })

  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }

  // Non-owners only see active/review/pending listings
  if (
    listing.sellerId !== session.user.id &&
    session.user.role !== 'ADMIN' &&
    (listing.status === 'DRAFT' || listing.status === 'ARCHIVED')
  ) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }

  // Strip dropboxLink unless: seller, admin, or buyer with accepted bid
  const isSeller = listing.sellerId === session.user.id
  const isAdmin  = session.user.role === 'ADMIN'
  if (!isSeller && !isAdmin) {
    const acceptedBid = await prisma.bid.findFirst({
      where: { listingId: id, bidderId: session.user.id, status: 'ACCEPTED' },
    })
    if (!acceptedBid) {
      (listing as Record<string, unknown>).dropboxLink = null
    }
  }

  return NextResponse.json({ success: true, data: listing })
}

// ─── PUT /api/listings/[id] ───────────────────────────────────────────────────

const UpdateSchema = z.object({
  title:          z.string().min(5).optional(),
  description:    z.string().optional(),
  assetType:      z.enum(['RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED']).optional(),
  unpaidBalance:  z.number().positive().optional(),
  loanCount:      z.number().int().positive().optional(),
  location:       z.string().min(2).optional(),
  zip:            z.string().optional(),
  region:         z.string().optional(),
  avgDelinquency: z.number().int().min(0).optional(),
  status:         z.enum(['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'PENDING', 'SOLD', 'ARCHIVED']).optional(),
  dropboxLink:    z.string().url().optional(),
  lienPosition:   z.enum(['SENIOR', 'JUNIOR']).optional(),
})

export async function PUT(req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }
  if (listing.sellerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({ success: true, data: updated })
}

// ─── DELETE /api/listings/[id] (soft delete → ARCHIVED) ──────────────────────

export async function DELETE(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }
  if (listing.sellerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  await prisma.listing.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  return NextResponse.json({ success: true })
}
