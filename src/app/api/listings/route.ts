import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { AssetType, ListingStatus } from '@prisma/client'

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
  const assetType = searchParams.get('assetType') as AssetType | null
  const status    = searchParams.get('status') as ListingStatus | null
  const region    = searchParams.get('region')
  const upbMin    = searchParams.get('upbMin') ? parseFloat(searchParams.get('upbMin')!) : undefined
  const upbMax    = searchParams.get('upbMax') ? parseFloat(searchParams.get('upbMax')!) : undefined

  const where = {
    ...(mine       ? { sellerId: session.user.id } : { status: status ?? 'ACTIVE' as ListingStatus }),
    ...(assetType  ? { assetType } : {}),
    ...(status && mine ? { status } : {}),
    ...(region     ? { region: { contains: region, mode: 'insensitive' as const } } : {}),
    ...(upbMin !== undefined || upbMax !== undefined
      ? { unpaidBalance: { ...(upbMin !== undefined ? { gte: upbMin } : {}), ...(upbMax !== undefined ? { lte: upbMax } : {}) } }
      : {}),
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, company: true } } },
      orderBy: { createdAt: 'desc' },
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
