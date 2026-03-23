import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { ContactSellerButton } from '@/components/listings/ContactSellerButton'
import { ArchiveListingButton } from '@/components/listings/ArchiveListingButton'
import type { AssetType, ListingStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Listing Detail' }

const TYPE_CLASS: Record<AssetType, string> = {
  RESIDENTIAL: 'residential', COMMERCIAL: 'commercial', CONSUMER: 'consumer', MIXED: 'mixed',
}
const STATUS_CLASS: Record<ListingStatus, string> = {
  ACTIVE: 'active', UNDER_REVIEW: 'review', PENDING: 'pending',
  DRAFT: 'pending', SOLD: 'active', ARCHIVED: 'pending',
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session!.user.id

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { seller: { select: { id: true, name: true, company: true, email: true } } },
  })

  if (!listing) notFound()

  const isOwner = listing.sellerId === userId
  const isAdmin = session!.user.role === 'ADMIN'

  // Hide drafts/archived from non-owners
  if (!isOwner && !isAdmin && (listing.status === 'DRAFT' || listing.status === 'ARCHIVED')) {
    notFound()
  }

  return (
    <div style={{ maxWidth: '800px' }}>
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

      {/* Key metrics */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {[
            { label: 'Unpaid Balance (UPB)', value: formatCurrency(listing.unpaidBalance) },
            { label: 'Number of Loans', value: listing.loanCount.toLocaleString() },
            { label: 'Location', value: listing.location },
            { label: 'Avg. Delinquency', value: listing.avgDelinquency ? `${listing.avgDelinquency} months` : '—' },
          ].map(({ label, value }) => (
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

      {/* Description */}
      {listing.description && (
        <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Description
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            {listing.description}
          </p>
        </div>
      )}

      {/* Seller info */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Seller
        </h3>
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

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {!isOwner && (
          <ContactSellerButton sellerId={listing.seller.id} listingId={listing.id} listingTitle={listing.title} />
        )}
        {isOwner && (
          <>
            <Link href={`/listings/${listing.id}/edit`} className="btn btn--ghost">
              Edit Listing
            </Link>
            <ArchiveListingButton listingId={listing.id} />
          </>
        )}
      </div>
    </div>
  )
}
