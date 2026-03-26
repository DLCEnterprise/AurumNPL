import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Generate last 30 days array
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const userId = session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  const thirtyDaysAgo = days[0]

  // Fetch raw data
  const [views, bids, messages] = await Promise.all([
    prisma.listingView.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        ...(isAdmin ? {} : { listing: { sellerId: userId } }),
      },
      select: { createdAt: true },
    }),
    prisma.bid.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        ...(isAdmin ? {} : { listing: { sellerId: userId } }),
      },
      select: { createdAt: true },
    }),
    prisma.message.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        senderId: { not: userId },
        conversation: { participants: { some: { userId } } },
      },
      select: { createdAt: true },
    }),
  ])

  // Group by day
  const format = (d: Date) => d.toISOString().slice(0, 10)
  const countByDay = (items: { createdAt: Date }[]) => {
    const map: Record<string, number> = {}
    items.forEach(i => { const k = format(i.createdAt); map[k] = (map[k] ?? 0) + 1 })
    return map
  }

  const viewMap = countByDay(views)
  const bidMap = countByDay(bids)
  const msgMap = countByDay(messages)

  const chartData = days.map(d => {
    const key = format(d)
    return {
      date: key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: viewMap[key] ?? 0,
      bids: bidMap[key] ?? 0,
      messages: msgMap[key] ?? 0,
    }
  })

  return NextResponse.json({ success: true, data: chartData })
}
