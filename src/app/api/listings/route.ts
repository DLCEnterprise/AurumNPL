import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
  const VALID_STATUSES: ListingStatus[] = ['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'PENDING', 'SOLD', 'ARCHIVED']
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

  const region    = searchParams.get('region')
  const q         = searchParams.get('q') ?? undefined
  const upbMin    = searchParams.get('upbMin') ? parseFloat(searchParams.get('upbMin')!) : undefined
  const upbMax    = searchParams.get('upbMax') ? parseFloat(searchParams.get('upbMax')!) : undefined
  const delinquencyMin = searchParams.get('delinquencyMin') ? parseInt(searchParams.get('delinquencyMin')!) : undefined
  const delinquencyMax = searchParams.get('delinquencyMax') ? parseInt(searchParams.get('delinquencyMax')!) : undefined
  const sortBy    = searchParams.get('sortBy') ?? 'newest'

  const orderBy = sortBy === 'upbAsc' ? { unpaidBalance: 'asc' as const }
    : sortBy === 'upbDesc' ? { unpaidBalance: 'desc' as const }
    : sortBy === 'delinquencyAsc' ? { avgDelinquency: 'asc' as const }
    : sortBy === 'delinquencyDesc' ? { avgDelinquency: 'desc' as const }
    : { createdAt: 'desc' as const }

  const where = {
    ...(mine       ? { sellerId: session.user.id } : { status: status ?? 'ACTIVE' as ListingStatus }),
    ...(assetType  ? { assetType } : {}),
    ...(status && mine ? { status } : {}),
    ...(region     ? { region: { contains: region, mode: 'insensitive' as const } } : {}),
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

const CreateSchema = z.object({
  title:         z.string().min(5, 'Title must be at least 5 characters.'),
  description:   z.string().optional(),
  assetType:     z.enum(['RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED']),
  unpaidBalance: z.number().positive('UPB must be a positive number.'),
  loanCount:     z.number().int().positive('Loan count must be a positive integer.'),
  location:      z.string().min(2, 'Location is required.'),
  region:        z.string().optional(),
  avgDelinquency:z.number().int().min(0).optional(),
  status:        z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
  dropboxLink:   z.string().url().optional(),
  lienPosition:  z.enum(['SENIOR', 'JUNIOR']).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'SELLER' && session.user.role !== 'ADMIN') {
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

  const listing = await prisma.listing.create({
    data: { ...parsed.data, sellerId: session.user.id },
  })

  return NextResponse.json({ success: true, data: listing }, { status: 201 })
}
