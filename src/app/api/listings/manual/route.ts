import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'SELLER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Only sellers can create listings.' }, { status: 403 })
  }

  const body = await req.json()

  const { title, assetType, ...assetFields } = body

  const unpaidBalance = assetFields.firstMtg_currentBalance
    ?? assetFields.firstMtg_modCurrentBalance
    ?? 0

  const location = [assetFields.propertyCity, assetFields.propertyState]
    .filter(Boolean).join(', ') || 'Unknown'

  const cityStateZip = [assetFields.propertyCity, assetFields.propertyState].filter(Boolean).join(', ')
    + (assetFields.propertyZip ? ` ${assetFields.propertyZip}` : '')
  const autoTitle = [assetFields.propertyStreet, cityStateZip].filter(Boolean).join(', ') || location

  // Strip nulls from assetFields so Prisma doesn't reject undefined keys
  const cleanAsset: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(assetFields)) {
    if (v !== undefined) cleanAsset[k] = v
  }

  const listing = await prisma.$transaction(async (tx) => {
    const newListing = await tx.listing.create({
      data: {
        title: title || autoTitle || 'Manual Entry',
        assetType: assetType || 'RESIDENTIAL',
        unpaidBalance,
        loanCount: 1,
        location,
        zip: assetFields.propertyZip ?? null,
        region: assetFields.propertyState ?? null,
        status: 'DRAFT',
        documents: [],
        sellerId: session.user.id,
      },
    })

    await tx.asset.create({
      data: { listingId: newListing.id, ...cleanAsset },
    })

    return newListing
  })

  return NextResponse.json({ success: true, data: { listingId: listing.id } }, { status: 201 })
}
