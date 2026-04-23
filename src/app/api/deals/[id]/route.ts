import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const UpdateTimelineSchema = z.object({
  bpoOrderedAt:  z.string().datetime().optional().nullable(),
  oeOrderedAt:   z.string().datetime().optional().nullable(),
  ddCompletedAt: z.string().datetime().optional().nullable(),
  mlpaSentAt:    z.string().datetime().optional().nullable(),
  mlpaSignedAt:  z.string().datetime().optional().nullable(),
  wireReceivedAt: z.string().datetime().optional().nullable(),
  closedAt:      z.string().datetime().optional().nullable(),
  notes:         z.string().max(2000).optional().nullable(),
})

export async function PATCH(req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const timeline = await prisma.dueDiligenceTimeline.findUnique({
    where: { id },
    include: { listing: { select: { sellerId: true } } },
  })
  if (!timeline) {
    return NextResponse.json({ success: false, error: 'Not found.' }, { status: 404 })
  }

  const isSeller = timeline.listing.sellerId === session.user.id
  const isAdmin  = session.user.role === 'ADMIN'
  if (!isSeller && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = UpdateTimelineSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
  }

  const data: Record<string, Date | null | undefined> = {}
  for (const [key, value] of Object.entries(parsed.data)) {
    data[key] = value === null ? null : value ? new Date(value as string) : undefined
  }

  const updated = await prisma.dueDiligenceTimeline.update({
    where: { id },
    data,
  })

  // Advance listing status based on completed milestones
  if (updated.closedAt) {
    await prisma.listing.update({ where: { id: updated.listingId }, data: { status: 'SOLD' } })
  } else if (updated.wireReceivedAt || updated.mlpaSignedAt) {
    await prisma.listing.update({ where: { id: updated.listingId }, data: { status: 'CLOSING' } })
  } else if (updated.ddCompletedAt) {
    await prisma.listing.update({ where: { id: updated.listingId }, data: { status: 'DUE_DILIGENCE' } })
  }

  return NextResponse.json({ success: true, data: updated })
}
