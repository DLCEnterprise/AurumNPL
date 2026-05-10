import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// ─── POST /api/listings/[id]/save ────────────────────────────────────────────

export async function POST(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { role } = session.user
  if (role !== 'BUYER' && role !== 'SELLER_BUYER' && role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await prisma.savedListing.upsert({
    where: { userId_listingId: { userId: session.user.id, listingId } },
    create: { userId: session.user.id, listingId },
    update: {},
  })

  return NextResponse.json({ success: true, data: { saved: true } })
}

// ─── DELETE /api/listings/[id]/save ──────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id: listingId } = await paramsPromise
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { role } = session.user
  if (role !== 'BUYER' && role !== 'SELLER_BUYER' && role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await prisma.savedListing.deleteMany({
    where: { userId: session.user.id, listingId },
  })

  return NextResponse.json({ success: true, data: { saved: false } })
}
