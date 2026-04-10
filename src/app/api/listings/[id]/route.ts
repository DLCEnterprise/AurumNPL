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
    include: {
      seller: { select: { id: true, name: true, company: true, email: true } },
      asset: true,
    },
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

const UpdateListingSchema = z.object({
  title:          z.string().min(1).optional(),
  description:    z.string().optional().nullable(),
  assetType:      z.enum(['RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED']).optional(),
  unpaidBalance:  z.number().optional(),
  loanCount:      z.number().int().optional(),
  location:       z.string().optional(),
  zip:            z.string().optional().nullable(),
  avgDelinquency: z.number().int().min(0).optional().nullable(),
  status:         z.enum(['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'PENDING', 'SOLD', 'ARCHIVED']).optional(),
  dropboxLink:    z.string().optional().nullable(),
  lienPosition:   z.enum(['SENIOR', 'JUNIOR']).optional().nullable(),
})

export async function PUT(req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({ where: { id }, include: { asset: true } })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }
  if (listing.sellerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json()

  // Separate listing-level fields from asset fields
  const {
    title, description, assetType, unpaidBalance, loanCount, location, zip,
    avgDelinquency, status, dropboxLink, lienPosition,
    ...rawAssetFields
  } = body

  const listingFields: Record<string, unknown> = {}
  if (title !== undefined)         listingFields.title = title
  if (description !== undefined)   listingFields.description = description
  if (assetType !== undefined)     listingFields.assetType = assetType
  if (unpaidBalance !== undefined) listingFields.unpaidBalance = Number(unpaidBalance)
  if (loanCount !== undefined)     listingFields.loanCount = Number(loanCount)
  if (location !== undefined)      listingFields.location = location
  if (zip !== undefined)           listingFields.zip = zip
  if (avgDelinquency !== undefined) listingFields.avgDelinquency = avgDelinquency !== null ? Number(avgDelinquency) : null
  if (status !== undefined)        listingFields.status = status
  if (dropboxLink !== undefined)   listingFields.dropboxLink = dropboxLink
  if (lienPosition !== undefined)  listingFields.lienPosition = lienPosition

  // Validate listing fields
  const listingValidation = UpdateListingSchema.safeParse(listingFields)
  if (!listingValidation.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.', details: listingValidation.error.flatten() }, { status: 422 })
  }

  // Build clean asset update (strip undefined, coerce types)
  const assetUpdate: Record<string, unknown> = {}
  const numFields = new Set([
    'fairMarketValue', 'homePurchasePrice', 'ltv', 'cltv', 'payoffCltv',
    'firstMtg_originalAmount', 'firstMtg_currentBalance', 'firstMtg_interestRate',
    'firstMtg_monthlyPI', 'firstMtg_monthlyEscrow', 'firstMtg_loanTermMonths',
    'firstMtg_totalMonthsPaid', 'firstMtg_monthsRemaining',
    'firstMtg_modLoanAmount', 'firstMtg_modCurrentBalance', 'firstMtg_modDeferredBalance',
    'firstMtg_modInterestRate', 'firstMtg_modMonthlyPI', 'firstMtg_modMonthlyEscrow',
    'firstMtg_modTermMonths', 'firstMtg_modMonthsPaid', 'firstMtg_modPaymentsRemaining',
    'firstMtg_foreclosureDefaultAmt',
    'secondMtg_originalAmount', 'secondMtg_currentBalance', 'secondMtg_interestRate',
    'secondMtg_monthlyPI', 'secondMtg_monthlyEscrow', 'secondMtg_loanTermMonths',
    'secondMtg_totalMonthsPaid', 'secondMtg_monthsRemaining',
  ])

  for (const [k, v] of Object.entries(rawAssetFields)) {
    if (v === undefined) continue
    if (v === null || v === '') {
      assetUpdate[k] = null
    } else if (numFields.has(k)) {
      const n = parseFloat(String(v).replace(/[$,%\s]/g, ''))
      assetUpdate[k] = isNaN(n) ? null : n
    } else {
      assetUpdate[k] = v
    }
  }

  // Auto-derive location from asset address fields if they're being updated
  if ('propertyCity' in assetUpdate || 'propertyState' in assetUpdate) {
    const city  = (assetUpdate.propertyCity  as string | null | undefined) ?? listing.asset?.propertyCity ?? null
    const state = (assetUpdate.propertyState as string | null | undefined) ?? listing.asset?.propertyState ?? null
    const derived = [city, state].filter(Boolean).join(', ')
    if (derived && !listingFields.location) listingFields.location = derived
  }

  // Auto-derive unpaidBalance from first mortgage balance if it's being updated
  const balanceFields = ['firstMtg_currentBalance', 'firstMtg_modCurrentBalance', 'secondMtg_currentBalance'] as const
  const updatingBalance = balanceFields.some((f) => f in assetUpdate && assetUpdate[f] != null)
  if (updatingBalance && !('unpaidBalance' in listingFields)) {
    const firstBal = (assetUpdate.firstMtg_currentBalance ?? assetUpdate.firstMtg_modCurrentBalance
      ?? listing.asset?.firstMtg_currentBalance ?? listing.asset?.firstMtg_modCurrentBalance) as number | null | undefined
    const secondBal = (assetUpdate.secondMtg_currentBalance ?? listing.asset?.secondMtg_currentBalance) as number | null | undefined
    const lienPos = (listingFields.lienPosition ?? listing.lienPosition) as string | null | undefined
    const upb = lienPos === 'JUNIOR' ? (secondBal ?? firstBal) : firstBal
    if (upb != null) listingFields.unpaidBalance = upb
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(listingFields).length > 0) {
      await tx.listing.update({ where: { id }, data: listingFields })
    }
    if (Object.keys(assetUpdate).length > 0) {
      if (listing.asset) {
        await tx.asset.update({ where: { listingId: id }, data: assetUpdate })
      } else {
        await tx.asset.create({ data: { listingId: id, ...assetUpdate } })
      }
    }
  })

  const updated = await prisma.listing.findUnique({
    where: { id },
    include: { asset: true },
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
