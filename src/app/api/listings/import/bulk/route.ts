import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCsvRow, type ParsedCsvListing } from '@/lib/csv-import'
import { generateListingNumber } from '@/lib/listing-number'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'SELLER' && session.user.role !== 'SELLER_BUYER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Only sellers can import listings.' }, { status: 403 })
  }

  const body = await req.json() as { rows: Record<string, string>[] }
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ success: false, error: 'No rows provided.' }, { status: 400 })
  }
  if (body.rows.length > 200) {
    return NextResponse.json({ success: false, error: 'Maximum 200 rows per import.' }, { status: 422 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = body.rows.map((r, i) => parseCsvRow(r as any, i + 1))

  const results: Array<{ rowIndex: number; listingId: string; title: string; warnings: string[] }> = []
  const errors: Array<{ rowIndex: number; error: string }> = []

  for (const p of parsed) {
    try {
      const listing = await createListing(p, session.user.id)
      results.push({ rowIndex: p.rowIndex, listingId: listing.id, title: p.title, warnings: p.warnings })
    } catch (err) {
      errors.push({ rowIndex: p.rowIndex, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return NextResponse.json({
    success: true,
    data: { created: results.length, failed: errors.length, results, errors },
  }, { status: 201 })
}

async function createListing(p: ParsedCsvListing & { rowIndex: number; warnings: string[] }, sellerId: string) {
  return prisma.$transaction(async (tx) => {
    const listingNumber = await generateListingNumber(tx)

    const listing = await tx.listing.create({
      data: {
        listingNumber,
        title:           p.title,
        assetType:       p.assetType,
        lienPosition:    p.lienPosition,
        unpaidBalance:   p.unpaidBalance,
        askingPrice:     p.askingPrice,
        bidDeadline:     p.bidDeadline,
        performanceStatus: p.performanceStatus,
        noteType:        p.noteType,
        description:     p.description,
        location:        p.location,
        zip:             p.zip,
        region:          p.region,
        loanCount:       1,
        status:          'DRAFT',
        documents:       [],
        sellerId,
      },
    })

    const a = p.asset
    await tx.asset.create({
      data: {
        listingId:              listing.id,
        propertyStreet:         a.propertyStreet,
        propertyCity:           a.propertyCity,
        propertyState:          a.propertyState,
        propertyZip:            a.propertyZip,
        propertyType:           a.propertyType,
        occupancyType:          a.occupancyType,
        fairMarketValue:        a.fairMarketValue,
        firstMtg_loanStatus:    a.firstMtg_loanStatus,
        firstMtg_currentBalance: a.firstMtg_currentBalance,
        firstMtg_originalAmount: a.firstMtg_originalAmount,
        firstMtg_interestRate:  a.firstMtg_interestRate,
        firstMtg_monthlyPI:     a.firstMtg_monthlyPI,
        firstMtg_originationDate: a.firstMtg_originationDate,
        firstMtg_maturityDate:  a.firstMtg_maturityDate,
        firstMtg_nextDueDate:   a.firstMtg_nextDueDate,
      },
    })

    return listing
  })
}
