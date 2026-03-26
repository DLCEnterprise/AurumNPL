import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AssetType, ListingStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Watchlist' }

const TYPE_CLASS: Record<AssetType, string> = {
  RESIDENTIAL: 'residential', COMMERCIAL: 'commercial', CONSUMER: 'consumer', MIXED: 'mixed',
}
const STATUS_CLASS: Record<ListingStatus, string> = {
  ACTIVE: 'active', UNDER_REVIEW: 'review', PENDING: 'pending',
  DRAFT: 'pending', SOLD: 'active', ARCHIVED: 'pending',
}

export default async function WatchlistPage() {
  const session = await auth()
  const userId  = session!.user.id

  const saved = await prisma.savedListing.findMany({
    where: { userId },
    include: {
      listing: {
        include: { seller: { select: { id: true, name: true, company: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '4px' }}>
          Watchlist
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {saved.length} saved listing{saved.length !== 1 ? 's' : ''}
        </p>
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          }
          title="Your watchlist is empty"
          description="Save listings to revisit them later."
          actionLabel="Browse Listings"
          actionHref="/listings"
        />
      ) : (
        <div className="listings__grid">
          {saved.map(({ listing }) => (
            <div key={listing.id} className="listing-card glass-card">
              <div className="listing-card__header">
                <span className={`listing-card__type listing-card__type--${TYPE_CLASS[listing.assetType]}`}>
                  {listing.assetType.charAt(0) + listing.assetType.slice(1).toLowerCase()}
                </span>
                <span className={`listing-card__status listing-card__status--${STATUS_CLASS[listing.status]}`}>
                  {listing.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="listing-card__title">{listing.title}</h3>
              <div className="listing-card__meta">
                <div className="listing-card__meta-item">
                  <span className="listing-card__meta-label">UPB</span>
                  <span className="listing-card__meta-value">{formatCurrency(listing.unpaidBalance)}</span>
                </div>
                <div className="listing-card__meta-item">
                  <span className="listing-card__meta-label">Loans</span>
                  <span className="listing-card__meta-value">{listing.loanCount.toLocaleString()}</span>
                </div>
                <div className="listing-card__meta-item">
                  <span className="listing-card__meta-label">Location</span>
                  <span className="listing-card__meta-value">{listing.location}{listing.zip ? ` ${listing.zip}` : ''}</span>
                </div>
                {listing.avgDelinquency != null && (
                  <div className="listing-card__meta-item">
                    <span className="listing-card__meta-label">Avg. Delinquency</span>
                    <span className="listing-card__meta-value">{listing.avgDelinquency} months</span>
                  </div>
                )}
              </div>
              {listing.seller && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {listing.seller.company ?? listing.seller.name}
                </div>
              )}
              <div className="listing-card__footer">
                <span className="listing-card__date">{timeAgo(listing.createdAt)}</span>
                <Link href={`/listings/${listing.id}`} className="btn btn--gold btn--sm">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
