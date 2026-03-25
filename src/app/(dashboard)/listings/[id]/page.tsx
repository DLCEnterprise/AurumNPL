import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { ContactSellerButton } from '@/components/listings/ContactSellerButton'
import { ArchiveListingButton } from '@/components/listings/ArchiveListingButton'
import { PublishListingButton } from '@/components/listings/PublishListingButton'
import { AssetDetail } from '@/components/listings/AssetDetail'
import { ViewTracker } from '@/components/listings/ViewTracker'
import { ListingAnalyticsCard } from '@/components/listings/ListingAnalyticsCard'
import { SaveListingButton } from '@/components/listings/SaveListingButton'
import { BidButton } from '@/components/listings/BidButton'
import type { AssetType, ListingStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Listing Detail' }

const TYPE_CLASS: Record<AssetType, string> = {
  RESIDENTIAL: 'residential', COMMERCIAL: 'commercial', CONSUMER: 'consumer', MIXED: 'mixed',
}
const STATUS_CLASS: Record<ListingStatus, string> = {
  ACTIVE: 'active', UNDER_REVIEW: 'review', PENDING: 'pending',
  DRAFT: 'pending', SOLD: 'active', ARCHIVED: 'pending',
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = session!.user.id

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, company: true, email: true } },
      asset: true,
    },
  })

  if (!listing) notFound()

  const isOwner = listing.sellerId === userId
  const isAdmin = session!.user.role === 'ADMIN'
  const isBuyer = session!.user.role === 'BUYER'

  if (!isOwner && !isAdmin && (listing.status === 'DRAFT' || listing.status === 'ARCHIVED')) {
    notFound()
  }

  // Serialise asset dates → ISO strings for client components
  const asset = listing.asset ? JSON.parse(JSON.stringify(listing.asset)) : null

  // Saved state + existing bid (for non-owners)
  const [savedRecord, existingBid, bidCount] = await Promise.all([
    !isOwner
      ? prisma.savedListing.findUnique({ where: { userId_listingId: { userId, listingId: id } } })
      : Promise.resolve(null),
    !isOwner && isBuyer
      ? prisma.bid.findFirst({ where: { listingId: id, bidderId: userId, status: 'PENDING' } })
      : Promise.resolve(null),
    isOwner || isAdmin
      ? prisma.bid.count({ where: { listingId: id } })
      : Promise.resolve(0),
  ])

  const isSaved = !!savedRecord
  const serializedBid = existingBid
    ? { id: existingBid.id, amount: existingBid.amount, noteRate: existingBid.noteRate, status: existingBid.status }
    : null

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Back link */}
      <Link href="/listings" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Listings
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span className={`listing-card__type listing-card__type--${TYPE_CLASS[listing.assetType]}`}>
            {listing.assetType.charAt(0) + listing.assetType.slice(1).toLowerCase()}
          </span>
          <span className={`listing-card__status listing-card__status--${STATUS_CLASS[listing.status]}`}>
            {listing.status.replace('_', ' ')}
          </span>
          {isOwner && (
            <span style={{ fontSize: '0.68rem', padding: '3px 9px', borderRadius: '100px', background: 'rgba(212,168,70,0.08)', color: 'var(--gold-400)', border: '1px solid rgba(212,168,70,0.15)' }}>
              Your Listing
            </span>
          )}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, marginBottom: '8px', lineHeight: 1.2 }}>
          {listing.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Listed {timeAgo(listing.createdAt)} · {listing.seller.company ?? listing.seller.name}
        </p>
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {!isOwner && (
          <ContactSellerButton sellerId={listing.seller.id} listingId={listing.id} listingTitle={listing.title} />
        )}
        {!isOwner && (
          <Link href={`/tools/yield-calculator?listingId=${listing.id}`} className="btn btn--ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Calculate Yield
          </Link>
        )}
        {!isOwner && (
          <SaveListingButton listingId={listing.id} initialSaved={isSaved} />
        )}
        {isOwner && (
          <>
            {listing.status === 'DRAFT' && <PublishListingButton listingId={listing.id} />}
            <Link href={`/listings/${listing.id}/edit`} className="btn btn--ghost">Edit Listing</Link>
            <Link href={`/listings/${listing.id}/bids`} className="btn btn--ghost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              View Bids{bidCount > 0 ? ` (${bidCount})` : ''}
            </Link>
            <ArchiveListingButton listingId={listing.id} />
          </>
        )}
      </div>

      {/* Bid form for buyers */}
      {!isOwner && isBuyer && listing.status === 'ACTIVE' && (
        <div style={{ marginBottom: '28px' }}>
          <BidButton listingId={listing.id} existingBid={serializedBid} />
        </div>
      )}

      {/* View tracking — fires silently on mount for all approved non-sellers */}
      <ViewTracker listingId={id} />

      {/* Analytics card — visible to listing owner and admins only */}
      {(isOwner || isAdmin) && <ListingAnalyticsCard listingId={id} />}

      {/* If no asset data, show the simple metrics card */}
      {!asset && (
        <>
          <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
              {[
                { label: 'Unpaid Balance (UPB)', value: formatCurrency(listing.unpaidBalance) },
                { label: 'Number of Loans', value: listing.loanCount.toLocaleString() },
                { label: 'Location', value: listing.location },
                { label: 'Avg. Delinquency', value: listing.avgDelinquency ? `${listing.avgDelinquency} months` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {listing.description && (
            <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>{listing.description}</p>
            </div>
          )}
        </>
      )}

      {/* Full asset detail (from imported spreadsheet) */}
      {asset && <AssetDetail asset={asset} />}

      {/* Seller info */}
      <div className="glass-card" style={{ padding: '28px', marginTop: asset ? '0' : '0', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>Seller</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(212,168,70,0.12)', border: '1px solid rgba(212,168,70,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold-300)', flexShrink: 0 }}>
            {(listing.seller.company ?? listing.seller.name ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{listing.seller.company ?? listing.seller.name}</div>
            {listing.seller.company && listing.seller.name && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{listing.seller.name}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
