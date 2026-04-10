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
import { AddToPipelineButton } from '@/components/listings/AddToPipelineButton'
import type { AssetType, ListingStatus } from '@prisma/client'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { NdaGate } from '@/components/listings/NdaGate'

export const metadata: Metadata = { title: 'Listing Detail' }

const TYPE_CLASS: Record<AssetType, string> = {
  RESIDENTIAL: 'residential', COMMERCIAL: 'commercial', CONSUMER: 'consumer', MIXED: 'mixed',
}
const STATUS_CLASS: Record<ListingStatus, string> = {
  ACTIVE: 'active', UNDER_REVIEW: 'review', PENDING: 'pending',
  DRAFT: 'pending', SOLD: 'active', ARCHIVED: 'pending',
}

const BID_STATUS_COLOR: Record<string, string> = {
  PENDING:   'rgba(212,168,70,0.8)',
  ACCEPTED:  '#34d399',
  REJECTED:  '#f87171',
  WITHDRAWN: 'var(--text-muted)',
  COUNTERED: '#fb923c',
}
const BID_STATUS_LABEL: Record<string, string> = {
  PENDING:   'Pending',
  ACCEPTED:  'Accepted',
  REJECTED:  'Declined',
  WITHDRAWN: 'Withdrawn',
  COUNTERED: 'Countered',
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
  const [savedRecord, existingBidRaw, bidCount, acceptedBid] = await Promise.all([
    !isOwner
      ? prisma.savedListing.findUnique({ where: { userId_listingId: { userId, listingId: id } } })
      : Promise.resolve(null),
    !isOwner && isBuyer
      ? prisma.bid.findFirst({
          where: { listingId: id, bidderId: userId },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve(null),
    isOwner || isAdmin
      ? prisma.bid.count({ where: { listingId: id } })
      : Promise.resolve(0),
    !isOwner && !isAdmin
      ? prisma.bid.findFirst({ where: { listingId: id, bidderId: userId, status: 'ACCEPTED' } })
      : Promise.resolve(null),
  ])

  const bidHistory = (isOwner || isAdmin) ? await prisma.bid.findMany({
    where: { listingId: id },
    include: { bidder: { select: { name: true, company: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  }) : []

  const canSeeDropbox = isOwner || isAdmin || !!acceptedBid

  const isSaved = !!savedRecord
  const serializedBid = existingBidRaw
    ? {
        id:            existingBidRaw.id,
        amount:        existingBidRaw.amount,
        noteRate:      existingBidRaw.noteRate,
        status:        existingBidRaw.status,
        counterAmount: existingBidRaw.counterAmount,
        counterNote:   existingBidRaw.counterNote,
      }
    : null

  return (
    <div style={{ maxWidth: '900px' }}>
      <Breadcrumbs items={[{ label: 'Listings', href: '/listings' }, { label: listing.title }]} />

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
        {/* Key deal metrics row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
          {(listing as { performanceStatus?: string | null }).performanceStatus && (
            <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: '100px', background: 'rgba(212,168,70,0.08)', color: 'var(--gold-400)', border: '1px solid rgba(212,168,70,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {(listing as { performanceStatus?: string | null }).performanceStatus}
            </span>
          )}
          {(listing as { noteType?: string | null }).noteType && (
            <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {(listing as { noteType?: string | null }).noteType}
            </span>
          )}
          {(listing as { askingPrice?: number | null }).askingPrice && (
            <span style={{ fontSize: '0.82rem', padding: '3px 12px', borderRadius: '100px', background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600 }}>
              {formatCurrency((listing as { askingPrice?: number | null }).askingPrice!)} Ask
            </span>
          )}
        </div>
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
        {!isOwner && isBuyer && (
          <AddToPipelineButton listingId={listing.id} />
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

      {/* Collateral Documents */}
      {listing.dropboxLink && (canSeeDropbox ? (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Collateral Documents</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Access the shared document folder for this listing.</p>
            </div>
            <a href={listing.dropboxLink} target="_blank" rel="noopener noreferrer" className="btn btn--gold btn--sm">
              Open in Dropbox →
            </a>
          </div>
        </div>
      ) : isBuyer ? (
        <div style={{ marginBottom: '20px' }}>
          <NdaGate listingId={id} dropboxLink={listing.dropboxLink} />
        </div>
      ) : null)}

      {/* View tracking — fires silently on mount for all approved non-sellers */}
      <ViewTracker listingId={id} />

      {/* Analytics card — visible to listing owner and admins only */}
      {(isOwner || isAdmin) && <ListingAnalyticsCard listingId={id} />}

      {/* Bid Activity timeline — visible to owner and admins */}
      {(isOwner || isAdmin) && bidHistory.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 }}>
              Bid Activity
            </h3>
            {bidCount > 10 && (
              <Link
                href={`/listings/${id}/bids`}
                style={{ fontSize: '0.8rem', color: 'var(--gold-400)', textDecoration: 'none' }}
              >
                View All →
              </Link>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {bidHistory.map((bid, index) => (
              <div
                key={bid.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: index < bidHistory.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                {/* Timeline dot */}
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: BID_STATUS_COLOR[bid.status] ?? 'var(--text-muted)', flexShrink: 0 }} />

                {/* Bidder */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {bid.bidder.company ?? bid.bidder.name ?? 'Unknown'}
                  </span>
                  {bid.bidder.company && bid.bidder.name && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      {bid.bidder.name}
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div style={{ fontSize: '0.88rem', fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--text-primary)', flexShrink: 0 }}>
                  {formatCurrency(bid.amount)}
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: BID_STATUS_COLOR[bid.status] ?? 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {BID_STATUS_LABEL[bid.status] ?? bid.status}
                </span>

                {/* Time */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {timeAgo(bid.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                { label: 'Lien Position', value: listing.lienPosition === 'SENIOR' ? 'Senior (1st Mortgage)' : listing.lienPosition === 'JUNIOR' ? 'Junior (2nd Mortgage)' : '—' },
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
