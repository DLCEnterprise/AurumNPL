import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ListingAnalyticsCardProps {
  listingId: string
}

interface AnalyticsData {
  totalViews: number
  uniqueVisitors: number
  viewsLast7Days: number
  bidCount: number
  savedCount: number
}

export async function ListingAnalyticsCard({ listingId }: ListingAnalyticsCardProps) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') return null

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  })
  if (!listing) return null

  const isOwner = listing.sellerId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return null

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalViews, viewsLast7Days, fingerprintGroups, bidCount, savedCount] =
    await Promise.all([
      prisma.listingView.count({ where: { listingId } }),
      prisma.listingView.count({
        where: { listingId, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.listingView.groupBy({
        by: ['fingerprint'],
        where: { listingId, fingerprint: { not: null } },
      }),
      prisma.bid.count({ where: { listingId } }),
      prisma.savedListing.count({ where: { listingId } }),
    ])

  const data: AnalyticsData = {
    totalViews,
    uniqueVisitors: fingerprintGroups.length,
    viewsLast7Days,
    bidCount,
    savedCount,
  }

  const stats = [
    { label: 'Total Views',      value: data.totalViews.toLocaleString() },
    { label: 'Unique Visitors',  value: data.uniqueVisitors.toLocaleString() },
    { label: 'Views This Week',  value: data.viewsLast7Days.toLocaleString() },
    { label: 'Bids Received',    value: data.bidCount.toLocaleString() },
    { label: 'Saves',            value: data.savedCount.toLocaleString() },
  ]

  return (
    <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: 'var(--gold-400)', flexShrink: 0 }}
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 }}>
          Listing Performance
        </h3>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '24px' }}>
        {stats.map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
