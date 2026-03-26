import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [activeListings, totalUPBResult, approvedUsers] = await Promise.all([
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.aggregate({ where: { status: 'ACTIVE' }, _sum: { unpaidBalance: true } }),
    prisma.user.count({ where: { approvalStatus: 'APPROVED' } }),
  ])

  return NextResponse.json({
    activeListings,
    totalUPB: totalUPBResult._sum.unpaidBalance ?? 0,
    approvedUsers,
  })
}
