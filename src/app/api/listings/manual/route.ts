import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'SELLER' && session.user.role !== 'SELLER_BUYER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Only sellers can create listings.' }, { status: 403 })
  }

  const body = await req.json()

  const { title, assetType, lienPosition, ...assetFields } = body

  // UPB: use subject loan balance based on lien position
  const unpaidBalance = lienPosition === 'JUNIOR'
    ? (assetFields.secondMtg_currentBalance ?? assetFields.firstMtg_currentBalance ?? assetFields.firstMtg_modCurrentBalance ?? 0)
    : (assetFields.firstMtg_currentBalance ?? assetFields.firstMtg_modCurrentBalance ?? assetFields.secondMtg_currentBalance ?? 0)

  const location = [assetFields.propertyCity, assetFields.propertyState]
    .filter(Boolean).join(', ') || 'Unknown'

  const cityStateZip = [assetFields.propertyCity, assetFields.propertyState].filter(Boolean).join(', ')
    + (assetFields.propertyZip ? ` ${assetFields.propertyZip}` : '')
  const autoTitle = [assetFields.propertyStreet, cityStateZip].filter(Boolean).join(', ') || location

  const dateFields = new Set([
    'homePurchaseDate',
    'firstMtg_originationDate', 'firstMtg_maturityDate', 'firstMtg_firstPaymentDate',
    'firstMtg_nextDueDate', 'firstMtg_interestPaidToDate', 'firstMtg_balloonDate',
    'firstMtg_modDate', 'firstMtg_modMaturityDate', 'firstMtg_modFirstPayDate',
    'firstMtg_modInterestPaidTo', 'firstMtg_foreclosureDefaultDate', 'firstMtg_foreclosureSaleDate',
    'secondMtg_originationDate', 'secondMtg_maturityDate', 'secondMtg_nextDueDate',
    'secondMtg_balloonDate', 'secondMtg_modDate', 'secondMtg_modMaturityDate', 'secondMtg_modFirstPayDate',
    'secondMtg_foreclosureDefaultDate', 'secondMtg_foreclosureSaleDate',
    'bkFilingDate', 'ch13PocFilingDate', 'bkConfirmationDate', 'bkDismissalDate', 'ch13DischargedDate',
    'ch7PetitionDate', 'ch7DateFiled', 'ch7DismissalDate', 'ch7DischargeDate',
    'prevCh13PetitionDate', 'prevCh13DateFiled', 'prevCh13DismissalDate', 'prevCh13DischargeDate',
    'lastPaymentReceivedDate',
  ])

  const cleanAsset: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(assetFields)) {
    if (v === undefined) continue
    if (v === null || v === '') {
      cleanAsset[k] = null
    } else if (dateFields.has(k)) {
      const d = new Date(v as string)
      cleanAsset[k] = isNaN(d.getTime()) ? null : d
    } else {
      cleanAsset[k] = v
    }
  }

  let listing
  try {
  let avgDelinquency: number | undefined
  const nextDueRaw = assetFields.firstMtg_nextDueDate as string | undefined
  if (nextDueRaw) {
    const due = new Date(nextDueRaw)
    if (!isNaN(due.getTime()) && due < new Date()) {
      const now = new Date()
      avgDelinquency = (now.getFullYear() - due.getFullYear()) * 12 + (now.getMonth() - due.getMonth())
    }
  }

    listing = await prisma.$transaction(async (tx) => {
      const newListing = await tx.listing.create({
        data: {
          title: title || autoTitle || 'Manual Entry',
          assetType: assetType || 'RESIDENTIAL',
          lienPosition: lienPosition ?? null,
          unpaidBalance,
          loanCount: 1,
          location,
          zip: assetFields.propertyZip ?? null,
          region: assetFields.propertyState ?? null,
          avgDelinquency: avgDelinquency ?? null,
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
  } catch (err) {
    console.error('[POST /api/listings/manual] transaction error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { listingId: listing.id } }, { status: 201 })
}
