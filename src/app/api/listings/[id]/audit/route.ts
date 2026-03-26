import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/listings/[id]/audit ────────────────────────────────────────────
// Returns audit logs for a listing. Only accessible by the listing seller or ADMIN.

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

  const isSeller = listing.sellerId === session.user.id
  const isAdmin  = session.user.role === 'ADMIN'

  if (!isSeller && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  const logs = await prisma.auditLog.findMany({
    where:   { listingId },
    orderBy: { createdAt: 'desc' },
    take:    50,
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ success: true, data: logs })
}
