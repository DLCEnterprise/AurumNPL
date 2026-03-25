import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    pendingUsers,
    approvedUsers,
    rejectedUsers,
    listingCounts,
    upbResult,
    newUsersThisWeek,
    totalConversations,
  ] = await Promise.all([
    prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.user.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.user.count({ where: { approvalStatus: 'REJECTED' } }),
    prisma.listing.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.listing.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { unpaidBalance: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.conversation.count(),
  ])

  const listingsByStatus = Object.fromEntries(
    listingCounts.map((row) => [row.status, row._count.id])
  )

  return NextResponse.json({
    usersByStatus: {
      PENDING: pendingUsers,
      APPROVED: approvedUsers,
      REJECTED: rejectedUsers,
    },
    listingsByStatus,
    totalUPB: upbResult._sum.unpaidBalance ?? 0,
    newUsersThisWeek,
    totalConversations,
  })
}
