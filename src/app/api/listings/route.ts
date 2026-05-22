import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateListingNumber } from '@/lib/listing-number'
import type { AssetType, ListingStatus, LienPosition } from '@prisma/client'

// ─── GET /api/listings ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit   = Math.min(50, parseInt(searchParams.get('limit') ?? '12'))
  const mine    = searchParams.get('mine') === 'true'

  const VALID_ASSET_TYPES: AssetType[] = ['RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED']
  const VALID_STATUSES: ListingStatus[] = ['DRAFT', 'ACTIVE', 'OFFER_ACCEPTED', 'DUE_DILIGENCE', 'CLOSING', 'UNDER_REVIEW', 'PENDING', 'SOLD', 'ARCHIVED']
  const VALID_LIEN_POSITIONS: LienPosition[] = ['SENIOR', 'JUNIOR']

  const assetTypeParam = searchParams.get('assetType')
  const assetType: AssetType | null = VALID_ASSET_TYPES.includes(assetTypeParam as AssetType)
    ? (assetTypeParam as AssetType)
    : null

  const statusParam = searchParams.get('status')
  const status: ListingStatus | null = VALID_STATUSES.includes(statusParam as ListingStatus)
    ? (statusParam as ListingStatus)
    : null

  const lienPositionParam = searchParams.get('lienPosition')
  const lienPosition: LienPosition | null = VALID_LIEN_POSITIONS.includes(lienPositionParam as LienPosition)
    ? (lienPositionParam as LienPosition)
    : null

  const region    = searchParams.get('state') ?? searchParams.get('region')
  const q         = searchParams.get('q') ?? undefined
  const upbMin    = searchParams.get('upbMin') ? parseFloat(searchParams.get('upbMin')!) : undefined
  const upbMax    = searchParams.get('upbMax') ? parseFloat(searchParams.get('upbMax')!) : undefined
  const delinquencyMin = searchParams.get('delinquencyMin') ? parseInt(searchParams.get('delinquencyMin')!) : undefined
  const delinquencyMax = searchParams.get('delinquencyMax') ? parseInt(searchParams.get('delinquencyMax')!) : undefined
  const sortBy    = searchParams.get('sortBy') ?? 'newest'

  // firstMortgage/secondMortgage sorts by lienPosition (SENIOR first, JUNIOR first)
  const orderBy = sortBy === 'upbAsc' ? { unpaidBalance: 'asc' as const }
    : sortBy === 'upbDesc' ? { unpaidBalance: 'desc' as const }
    : sortBy === 'delinquencyAsc' ? { avgDelinquency: 'asc' as const }
    : sortBy === 'delinquencyDesc' ? { avgDelinquency: 'desc' as const }
    : sortBy === 'firstMortgage' ? { lienPosition: 'asc' as const }   // JUNIOR < SENIOR alphabetically, so asc = JUNIOR first; we want SENIOR first → desc
    : sortBy === 'secondMortgage' ? { lienPosition: 'desc' as const }
    : { createdAt: 'desc' as const }

  const where = {
    ...(mine       ? { sellerId: session.user.id } : { status: status ?? 'ACTIVE' as ListingStatus }),
    ...(assetType  ? { assetType } : {}),
    ...(status && mine ? { status } : {}),
    ...(region     ? { location: { contains: region, mode: 'insensitive' as const } } : {}),
    ...(lienPosition ? { lienPosition } : {}),
    ...(upbMin !== undefined || upbMax !== undefined
      ? { unpaidBalance: { ...(upbMin !== undefined ? { gte: upbMin } : {}), ...(upbMax !== undefined ? { lte: upbMax } : {}) } }
      : {}),
    ...(delinquencyMin !== undefined || delinquencyMax !== undefined ? {
      avgDelinquency: {
        ...(delinquencyMin !== undefined ? { gte: delinquencyMin } : {}),
        ...(delinquencyMax !== undefined ? { lte: delinquencyMax } : {}),
      }
    } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { location: { contains: q, mode: 'insensitive' as const } },
      ]
    } : {}),
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, company: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: { listings, total, page, limit, pages: Math.ceil(total / limit) },
  })
}

// ─── POST /api/listings ───────────────────────────────────────────────────────

const AssetSchema = z.object({
  firstMtg_loanStatus:        z.string().optional(),
  firstMtg_interestRate:      z.number().optional(),
  firstMtg_originationDate:   z.string().optional(),
  firstMtg_maturityDate:      z.string().optional(),
  firstMtg_firstPaymentDate:  z.string().optional(),
  firstMtg_originalAmount:    z.number().optional(),
  firstMtg_currentBalance:    z.number().optional(),
  firstMtg_monthlyPI:         z.number().optional(),
  firstMtg_monthlyEscrow:     z.number().optional(),
  firstMtg_nextDueDate:       z.string().optional(),
  firstMtg_loanTermMonths:    z.number().int().optional(),
  firstMtg_totalMonthsPaid:   z.number().int().optional(),
  firstMtg_monthsRemaining:   z.number().int().optional(),
  firstMtg_interestPaidToDate:z.string().optional(),
  lastPaymentReceivedDate:    z.string().optional(),
  paymentAccepted:            z.string().optional(),
  isInterestOnly:             z.boolean().optional(),
  interestOnlyPeriod:         z.number().int().optional(),
  totalMonthlyPayment:        z.number().optional(),
  propertyType:               z.string().optional(),
  propertyStreet:             z.string().optional(),
  propertyCity:               z.string().optional(),
  propertyState:              z.string().optional(),
  propertyZip:                z.string().optional(),
  county:                     z.string().optional(),
  yearBuilt:                  z.number().int().optional(),
  floorSizeSqFt:              z.number().optional(),
  lotSizeSqFt:                z.number().optional(),
  bedrooms:                   z.number().int().optional(),
  bathrooms:                  z.number().optional(),
  occupancyType:              z.string().optional(),
  fairMarketValue:            z.number().optional(),
  homePurchaseDate:           z.string().optional(),
  homePurchasePrice:          z.number().optional(),
  ltv:                        z.number().optional(),
  cltv:                       z.number().optional(),
  borrowerEverFiledBK:        z.boolean().optional(),
  isInBankruptcy:             z.boolean().optional(),
  bankruptcyChapter:          z.string().optional(),
  bkCaseNumber:               z.string().optional(),
  bkFilingDate:               z.string().optional(),
  ch13PocFilingDate:          z.string().optional(),
  bkConfirmationDate:         z.string().optional(),
  bkDismissalDate:            z.string().optional(),
  ch13DischargedDate:         z.string().optional(),
  ch7PetitionDate:            z.string().optional(),
  ch7CaseNumber:              z.string().optional(),
  ch7DateFiled:               z.string().optional(),
  ch7DismissalDate:           z.string().optional(),
  ch7DischargeDate:           z.string().optional(),
  prevCh13PetitionDate:       z.string().optional(),
  prevCh13CaseNumber:         z.string().optional(),
  prevCh13DateFiled:          z.string().optional(),
  prevCh13DismissalDate:      z.string().optional(),
  prevCh13DischargeDate:      z.string().optional(),
  legalStatus:                z.string().optional(),
  isJudicialState:            z.boolean().optional(),
  firstMtg_foreclosureDefaultDate: z.string().optional(),
  firstMtg_foreclosureDefaultAmt:  z.number().optional(),
  firstMtg_foreclosureSaleDate:    z.string().optional(),
  secondMtg_loanStatus:       z.string().optional(),
  secondMtg_originationDate:  z.string().optional(),
  secondMtg_maturityDate:     z.string().optional(),
  secondMtg_originalAmount:   z.number().optional(),
  secondMtg_currentBalance:   z.number().optional(),
  secondMtg_interestRate:     z.number().optional(),
  secondMtg_monthlyPI:        z.number().optional(),
  secondMtg_nextDueDate:      z.string().optional(),
  secondMtg_foreclosureDefaultDate: z.string().optional(),
  secondMtg_foreclosureDefaultAmt:  z.number().optional(),
  secondMtg_foreclosureSaleDate:    z.string().optional(),
  firstMtg_isModified:          z.boolean().optional(),
  firstMtg_hasBalloon:          z.boolean().optional(),
  firstMtg_balloonDate:         z.string().optional(),
  firstMtg_modDate:             z.string().optional(),
  firstMtg_modMaturityDate:     z.string().optional(),
  firstMtg_modTermMonths:       z.number().int().optional(),
  firstMtg_modFirstPayDate:     z.string().optional(),
  firstMtg_modInterestRate:     z.number().optional(),
  firstMtg_modLoanAmount:       z.number().optional(),
  firstMtg_modCurrentBalance:   z.number().optional(),
  firstMtg_modDeferredBalance:  z.number().optional(),
  firstMtg_modMonthlyPI:        z.number().optional(),
  firstMtg_modMonthlyEscrow:    z.number().optional(),
  firstMtg_modMonthsPaid:       z.number().int().optional(),
  firstMtg_modPaymentsRemaining:z.number().int().optional(),
  secondMtg_isModified:          z.boolean().optional(),
  secondMtg_hasBalloon:          z.boolean().optional(),
  secondMtg_balloonDate:         z.string().optional(),
  secondMtg_modDate:             z.string().optional(),
  secondMtg_modMaturityDate:     z.string().optional(),
  secondMtg_modTermMonths:       z.number().int().optional(),
  secondMtg_modFirstPayDate:     z.string().optional(),
  secondMtg_modInterestRate:     z.number().optional(),
  secondMtg_modLoanAmount:       z.number().optional(),
  secondMtg_modCurrentBalance:   z.number().optional(),
  secondMtg_modDeferredBalance:  z.number().optional(),
  secondMtg_modMonthlyPI:         z.number().optional(),
  secondMtg_modPaymentsRemaining: z.number().int().optional(),
  firstMtg_accruedInterest:       z.number().optional(),
  firstMtg_lateFees:              z.number().optional(),
  secondMtg_accruedInterest:      z.number().optional(),
  secondMtg_lateFees:             z.number().optional(),
  payoffCltv:                     z.number().optional(),
}).optional()

const CreateSchema = z.object({
  title:             z.string().min(5, 'Title must be at least 5 characters.'),
  description:       z.string().optional(),
  assetType:         z.enum(['RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED']),
  unpaidBalance:     z.number().positive('UPB must be a positive number.'),
  loanCount:         z.number().int().positive('Loan count must be a positive integer.'),
  location:          z.string().min(2, 'Location is required.'),
  region:            z.string().optional(),
  avgDelinquency:    z.number().int().min(0).optional(),
  status:            z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
  dropboxLink:       z.string().url().optional(),
  lienPosition:        z.enum(['SENIOR', 'JUNIOR']).optional(),
  askingPrice:         z.number().positive().optional(),
  performanceStatus:   z.string().optional(),
  noteType:            z.string().optional(),
  listingType:         z.string().optional(),
  bidDeadline:         z.string().optional(),
  reservePrice:        z.number().positive().optional(),
  preferredClosingDays:z.number().int().optional(),
  ndaRequired:         z.boolean().optional(),
  asset:               AssetSchema,
})

function parseDate(s: string | undefined | null): Date | undefined {
  if (!s) return undefined
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'SELLER' && session.user.role !== 'SELLER_BUYER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Only sellers can create listings.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
    }
    return NextResponse.json({ success: false, error: 'Validation failed.', fieldErrors }, { status: 422 })
  }

  const { asset: assetData, bidDeadline: bidDeadlineStr, ...listingData } = parsed.data

  // Auto-compute avgDelinquency if not provided and firstMtg_nextDueDate is in the past
  if (listingData.avgDelinquency == null && assetData?.firstMtg_nextDueDate) {
    const due = new Date(assetData.firstMtg_nextDueDate)
    if (!isNaN(due.getTime()) && due < new Date()) {
      const now = new Date()
      listingData.avgDelinquency = (now.getFullYear() - due.getFullYear()) * 12 + (now.getMonth() - due.getMonth())
    }
  }

  let listing
  try {
  listing = await prisma.$transaction(async (tx) => {
    const listingNumber = await generateListingNumber(tx)
    const created = await tx.listing.create({
      data: { ...listingData, listingNumber, bidDeadline: parseDate(bidDeadlineStr), sellerId: session.user.id },
    })

    if (assetData) {
      const ad = assetData
      await tx.asset.create({
        data: {
          listingId: created.id,
          firstMtg_loanStatus:        ad.firstMtg_loanStatus,
          firstMtg_interestRate:      ad.firstMtg_interestRate,
          firstMtg_originationDate:   parseDate(ad.firstMtg_originationDate),
          firstMtg_maturityDate:      parseDate(ad.firstMtg_maturityDate),
          firstMtg_firstPaymentDate:  parseDate(ad.firstMtg_firstPaymentDate),
          firstMtg_originalAmount:    ad.firstMtg_originalAmount,
          firstMtg_currentBalance:    ad.firstMtg_currentBalance,
          firstMtg_monthlyPI:         ad.firstMtg_monthlyPI,
          firstMtg_monthlyEscrow:     ad.firstMtg_monthlyEscrow,
          firstMtg_nextDueDate:       parseDate(ad.firstMtg_nextDueDate),
          firstMtg_loanTermMonths:    ad.firstMtg_loanTermMonths,
          firstMtg_totalMonthsPaid:   ad.firstMtg_totalMonthsPaid,
          firstMtg_monthsRemaining:   ad.firstMtg_monthsRemaining,
          firstMtg_interestPaidToDate:parseDate(ad.firstMtg_interestPaidToDate),
          lastPaymentReceivedDate:    parseDate(ad.lastPaymentReceivedDate),
          paymentAccepted:            ad.paymentAccepted,
          isInterestOnly:             ad.isInterestOnly,
          interestOnlyPeriod:         ad.interestOnlyPeriod,
          totalMonthlyPayment:        ad.totalMonthlyPayment,
          propertyType:               ad.propertyType,
          propertyStreet:             ad.propertyStreet,
          propertyCity:               ad.propertyCity,
          propertyState:              ad.propertyState,
          propertyZip:                ad.propertyZip,
          county:                     ad.county,
          yearBuilt:                  ad.yearBuilt,
          floorSizeSqFt:              ad.floorSizeSqFt,
          lotSizeSqFt:                ad.lotSizeSqFt,
          bedrooms:                   ad.bedrooms,
          bathrooms:                  ad.bathrooms,
          occupancyType:              ad.occupancyType,
          fairMarketValue:            ad.fairMarketValue,
          homePurchaseDate:           parseDate(ad.homePurchaseDate),
          homePurchasePrice:          ad.homePurchasePrice,
          ltv:                        ad.ltv,
          cltv:                       ad.cltv,
          borrowerEverFiledBK:        ad.borrowerEverFiledBK,
          isInBankruptcy:             ad.isInBankruptcy,
          bankruptcyChapter:          ad.bankruptcyChapter,
          bkCaseNumber:               ad.bkCaseNumber,
          bkFilingDate:               parseDate(ad.bkFilingDate),
          ch13PocFilingDate:          parseDate(ad.ch13PocFilingDate),
          bkConfirmationDate:         parseDate(ad.bkConfirmationDate),
          bkDismissalDate:            parseDate(ad.bkDismissalDate),
          ch13DischargedDate:         parseDate(ad.ch13DischargedDate),
          ch7PetitionDate:            parseDate(ad.ch7PetitionDate),
          ch7CaseNumber:              ad.ch7CaseNumber,
          ch7DateFiled:               parseDate(ad.ch7DateFiled),
          ch7DismissalDate:           parseDate(ad.ch7DismissalDate),
          ch7DischargeDate:           parseDate(ad.ch7DischargeDate),
          prevCh13PetitionDate:       parseDate(ad.prevCh13PetitionDate),
          prevCh13CaseNumber:         ad.prevCh13CaseNumber,
          prevCh13DateFiled:          parseDate(ad.prevCh13DateFiled),
          prevCh13DismissalDate:      parseDate(ad.prevCh13DismissalDate),
          prevCh13DischargeDate:      parseDate(ad.prevCh13DischargeDate),
          legalStatus:                ad.legalStatus,
          isJudicialState:            ad.isJudicialState,
          firstMtg_foreclosureDefaultDate: parseDate(ad.firstMtg_foreclosureDefaultDate),
          firstMtg_foreclosureDefaultAmt:  ad.firstMtg_foreclosureDefaultAmt,
          firstMtg_foreclosureSaleDate:    parseDate(ad.firstMtg_foreclosureSaleDate),
          secondMtg_loanStatus:       ad.secondMtg_loanStatus,
          secondMtg_originationDate:  parseDate(ad.secondMtg_originationDate),
          secondMtg_maturityDate:     parseDate(ad.secondMtg_maturityDate),
          secondMtg_originalAmount:   ad.secondMtg_originalAmount,
          secondMtg_currentBalance:   ad.secondMtg_currentBalance,
          secondMtg_interestRate:     ad.secondMtg_interestRate,
          secondMtg_monthlyPI:        ad.secondMtg_monthlyPI,
          secondMtg_nextDueDate:      parseDate(ad.secondMtg_nextDueDate),
          secondMtg_foreclosureDefaultDate: parseDate(ad.secondMtg_foreclosureDefaultDate),
          secondMtg_foreclosureDefaultAmt:  ad.secondMtg_foreclosureDefaultAmt,
          secondMtg_foreclosureSaleDate:    parseDate(ad.secondMtg_foreclosureSaleDate),
          firstMtg_isModified:          ad.firstMtg_isModified,
          firstMtg_hasBalloon:          ad.firstMtg_hasBalloon,
          firstMtg_balloonDate:         parseDate(ad.firstMtg_balloonDate),
          firstMtg_modDate:             parseDate(ad.firstMtg_modDate),
          firstMtg_modMaturityDate:     parseDate(ad.firstMtg_modMaturityDate),
          firstMtg_modTermMonths:       ad.firstMtg_modTermMonths,
          firstMtg_modFirstPayDate:     parseDate(ad.firstMtg_modFirstPayDate),
          firstMtg_modInterestRate:     ad.firstMtg_modInterestRate,
          firstMtg_modLoanAmount:       ad.firstMtg_modLoanAmount,
          firstMtg_modCurrentBalance:   ad.firstMtg_modCurrentBalance,
          firstMtg_modDeferredBalance:  ad.firstMtg_modDeferredBalance,
          firstMtg_modMonthlyPI:        ad.firstMtg_modMonthlyPI,
          firstMtg_modMonthlyEscrow:    ad.firstMtg_modMonthlyEscrow,
          firstMtg_modMonthsPaid:       ad.firstMtg_modMonthsPaid,
          firstMtg_modPaymentsRemaining:ad.firstMtg_modPaymentsRemaining,
          secondMtg_isModified:          ad.secondMtg_isModified,
          secondMtg_hasBalloon:          ad.secondMtg_hasBalloon,
          secondMtg_balloonDate:         parseDate(ad.secondMtg_balloonDate),
          secondMtg_modDate:             parseDate(ad.secondMtg_modDate),
          secondMtg_modMaturityDate:     parseDate(ad.secondMtg_modMaturityDate),
          secondMtg_modTermMonths:       ad.secondMtg_modTermMonths,
          secondMtg_modFirstPayDate:     parseDate(ad.secondMtg_modFirstPayDate),
          secondMtg_modInterestRate:     ad.secondMtg_modInterestRate,
          secondMtg_modLoanAmount:       ad.secondMtg_modLoanAmount,
          secondMtg_modCurrentBalance:   ad.secondMtg_modCurrentBalance,
          secondMtg_modDeferredBalance:  ad.secondMtg_modDeferredBalance,
          secondMtg_modMonthlyPI:         ad.secondMtg_modMonthlyPI,
          secondMtg_modPaymentsRemaining: ad.secondMtg_modPaymentsRemaining,
          firstMtg_accruedInterest:       ad.firstMtg_accruedInterest,
          firstMtg_lateFees:              ad.firstMtg_lateFees,
          secondMtg_accruedInterest:      ad.secondMtg_accruedInterest,
          secondMtg_lateFees:             ad.secondMtg_lateFees,
          payoffCltv:                     ad.payoffCltv,
        },
      })
    }

    return created
  })
  } catch (err) {
    console.error('[POST /api/listings] transaction error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: listing }, { status: 201 })
}
