import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DealStage } from '@prisma/client'

// ─── GET /api/deal-pipeline ───────────────────────────────────────────────────
// Returns pipeline items grouped by stage for the current user

export async function GET() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.dealPipeline.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          unpaidBalance: true,
          lienPosition: true,
          loanCount: true,
          location: true,
          status: true,
          assetType: true,
          seller: { select: { name: true, company: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Group by stage
  const grouped = Object.fromEntries(
    Object.values(DealStage).map((stage) => [stage, [] as typeof items])
  ) as Record<DealStage, typeof items>

  for (const item of items) {
    grouped[item.stage].push(item)
  }

  return NextResponse.json({ success: true, data: grouped })
}

// ─── POST /api/deal-pipeline ──────────────────────────────────────────────────
// Add a listing to the pipeline (upsert by userId + listingId)

const PostSchema = z.object({
  listingId: z.string(),
  stage: z.nativeEnum(DealStage).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed.', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { listingId, stage = DealStage.REVIEWING } = parsed.data

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }

  const item = await prisma.dealPipeline.upsert({
    where: { userId_listingId: { userId: session.user.id, listingId } },
    create: { userId: session.user.id, listingId, stage },
    update: { stage },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          unpaidBalance: true,
          lienPosition: true,
          loanCount: true,
          location: true,
          status: true,
          assetType: true,
          seller: { select: { name: true, company: true } },
        },
      },
    },
  })

  return NextResponse.json({ success: true, data: item }, { status: 201 })
}

// ─── PATCH /api/deal-pipeline ─────────────────────────────────────────────────
// Update stage and/or notes for a pipeline item

const PatchSchema = z.object({
  id: z.string(),
  stage: z.nativeEnum(DealStage).optional(),
  notes: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed.', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { id, stage, notes } = parsed.data

  const existing = await prisma.dealPipeline.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Pipeline item not found.' }, { status: 404 })
  }

  const updated = await prisma.dealPipeline.update({
    where: { id },
    data: {
      ...(stage !== undefined && { stage }),
      ...(notes !== undefined && { notes }),
    },
  })

  return NextResponse.json({ success: true, data: updated })
}

// ─── DELETE /api/deal-pipeline?id= ───────────────────────────────────────────
// Remove a pipeline item

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const id = new URL(req.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id.' }, { status: 422 })
  }

  const existing = await prisma.dealPipeline.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Pipeline item not found.' }, { status: 404 })
  }

  await prisma.dealPipeline.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
