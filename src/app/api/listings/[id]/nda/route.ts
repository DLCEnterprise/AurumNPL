import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/listings/[id]/nda — check if current user has signed
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const nda = await prisma.ndaAgreement.findUnique({
    where: { listingId_buyerId: { listingId: id, buyerId: session.user.id } },
  })

  return NextResponse.json({ success: true, signed: nda !== null, signedAt: nda?.signedAt ?? null })
}

// POST /api/listings/[id]/nda — sign NDA and gain document access
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role === 'SELLER') {
    // Pure sellers cannot sign NDAs; SELLER_BUYER can (they're also a buyer)
    return NextResponse.json({ success: false, error: 'Sellers cannot sign NDAs.' }, { status: 403 })
  }

  const { id } = await params

  const listing = await prisma.listing.findUnique({ where: { id }, select: { id: true, status: true, ndaRequired: true } })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }
  if (!listing.ndaRequired) {
    return NextResponse.json({ success: false, error: 'This listing does not require an NDA.' }, { status: 422 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = req.headers.get('user-agent') ?? null

  let nda
  try {
    nda = await prisma.ndaAgreement.upsert({
      where: { listingId_buyerId: { listingId: id, buyerId: session.user.id } },
      create: { listingId: id, buyerId: session.user.id, ipAddress: ip, userAgent: ua },
      update: {},
    })
  } catch (err) {
    console.error('[POST /api/listings/[id]/nda] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  return NextResponse.json({ success: true, signedAt: nda.signedAt }, { status: 201 })
}
