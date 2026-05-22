import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/listings/[id]/due-diligence ────────────────────────────────────
// Returns all checklist items for this listing.

export async function GET(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }

  const items = await prisma.dueDiligenceChecklist.findMany({
    where:   { listingId },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ success: true, data: items })
}

// ─── POST /api/listings/[id]/due-diligence ───────────────────────────────────
// Creates a new checklist item.

const CreateSchema = z.object({
  label: z.string().min(1).max(200),
})

export async function POST(req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) {
    return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed.', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  // Determine next sortOrder
  const last = await prisma.dueDiligenceChecklist.findFirst({
    where:   { listingId },
    orderBy: { sortOrder: 'desc' },
  })

  let item
  try {
    item = await prisma.dueDiligenceChecklist.create({
      data: {
        listingId,
        label:     parsed.data.label,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    })
  } catch (err) {
    console.error('[POST /api/listings/[id]/due-diligence] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: item }, { status: 201 })
}

// ─── PATCH /api/listings/[id]/due-diligence?checklistId=xxx ──────────────────
// Toggles completed status or updates the label.

const PatchSchema = z.object({
  completed: z.boolean().optional(),
  label:     z.string().min(1).max(200).optional(),
})

export async function PATCH(req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const url         = new URL(req.url)
  const checklistId = url.searchParams.get('checklistId')
  if (!checklistId) {
    return NextResponse.json({ success: false, error: 'checklistId query param is required.' }, { status: 400 })
  }

  const existing = await prisma.dueDiligenceChecklist.findFirst({
    where: { id: checklistId, listingId },
  })
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Item not found.' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed.', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const updateData: {
    completed?:   boolean
    completedBy?: string | null
    completedAt?: Date | null
    label?:       string
  } = {}

  if (parsed.data.label !== undefined) {
    updateData.label = parsed.data.label
  }

  if (parsed.data.completed !== undefined) {
    updateData.completed   = parsed.data.completed
    updateData.completedBy = parsed.data.completed ? (session.user.name ?? session.user.id) : null
    updateData.completedAt = parsed.data.completed ? new Date() : null
  }

  let updated
  try {
    updated = await prisma.dueDiligenceChecklist.update({
      where: { id: checklistId },
      data:  updateData,
    })
  } catch (err) {
    console.error('[PATCH /api/listings/[id]/due-diligence] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: updated })
}

// ─── DELETE /api/listings/[id]/due-diligence?checklistId=xxx ─────────────────
// Deletes a checklist item.

export async function DELETE(req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const url         = new URL(req.url)
  const checklistId = url.searchParams.get('checklistId')
  if (!checklistId) {
    return NextResponse.json({ success: false, error: 'checklistId query param is required.' }, { status: 400 })
  }

  const existing = await prisma.dueDiligenceChecklist.findFirst({
    where: { id: checklistId, listingId },
  })
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Item not found.' }, { status: 404 })
  }

  try {
    await prisma.dueDiligenceChecklist.delete({ where: { id: checklistId } })
  } catch (err) {
    console.error('[DELETE /api/listings/[id]/due-diligence] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
