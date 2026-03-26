import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const [recentBids, recentMessages, recentNotifications] = await Promise.all([
    // Bids on user's listings (for sellers) or by user (for buyers)
    prisma.bid.findMany({
      where: session.user.role === 'BUYER'
        ? { bidderId: userId }
        : { listing: { sellerId: userId } },
      include: {
        listing: { select: { title: true, id: true } },
        bidder: { select: { name: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.message.findMany({
      where: {
        conversation: { participants: { some: { userId } } },
        senderId: { not: userId },
      },
      include: { sender: { select: { name: true, company: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  // Merge and sort by date
  const events = [
    ...recentBids.map(b => ({
      type: 'bid' as const,
      id: b.id,
      title: `Bid on ${b.listing.title}`,
      subtitle: `${b.bidder.company ?? b.bidder.name} — $${b.amount.toLocaleString()}`,
      href: `/listings/${b.listingId}/bids`,
      createdAt: b.createdAt,
    })),
    ...recentMessages.map(m => ({
      type: 'message' as const,
      id: m.id,
      title: 'New message',
      subtitle: m.sender.company ?? m.sender.name ?? 'Unknown',
      href: '/messages',
      createdAt: m.createdAt,
    })),
    ...recentNotifications.map(n => ({
      type: 'notification' as const,
      id: n.id,
      title: n.title ?? n.type,
      subtitle: n.body ?? '',
      href: '/dashboard',
      createdAt: n.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)

  return NextResponse.json({ success: true, data: events })
}
