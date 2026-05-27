'use client'

import Link from 'next/link'
import { usePreferences } from '@/lib/preferences'
import { formatCurrency, timeAgo } from '@/lib/utils'
import type { AssetType, ListingStatus, LienPosition } from '@prisma/client'

export type ListingForResults = {
  id: string
  title: string
  assetType: AssetType
  status: ListingStatus
  lienPosition: LienPosition | null
  unpaidBalance: number
  loanCount: number
  location: string
  zip: string | null
  avgDelinquency: number | null
  createdAt: string
  seller: { company: string | null; name: string | null } | null
  asset: {
    propertyStreet: string | null
    propertyCity:   string | null
    propertyState:  string | null
    propertyZip:    string | null
  } | null
}

const TYPE_CLASS: Record<AssetType, string> = {
  RESIDENTIAL: 'residential',
  COMMERCIAL:  'commercial',
  CONSUMER:    'consumer',
  MIXED:       'mixed',
}
const STATUS_CLASS: Record<ListingStatus, string> = {
  ACTIVE: 'active', UNDER_REVIEW: 'review', PENDING: 'pending',
  DRAFT: 'pending', SOLD: 'active', ARCHIVED: 'pending',
  OFFER_ACCEPTED: 'active', DUE_DILIGENCE: 'review', CLOSING: 'review',
}

function buildStreetViewUrl(listing: ListingForResults, mapsKey: string, size = '600x280'): string {
  const a = listing.asset
  if (!a || !mapsKey) return ''
  const address = [a.propertyStreet, a.propertyCity, a.propertyState, a.propertyZip].filter(Boolean).join(', ')
  if (!address) return ''
  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodeURIComponent(address)}&key=${mapsKey}&source=outdoor&fov=80`
}

// ──────────────────────────────────────────────────────────────────────────────
// Top-level switch
// ──────────────────────────────────────────────────────────────────────────────

export function ListingResults({ listings, mapsKey }: { listings: ListingForResults[]; mapsKey: string }) {
  const { listingsView } = usePreferences()

  if (listingsView === 'list') {
    return <ListingsListView listings={listings} mapsKey={mapsKey} />
  }
  return <ListingsGridView listings={listings} mapsKey={mapsKey} />
}

// ──────────────────────────────────────────────────────────────────────────────
// Grid view (existing card layout)
// ──────────────────────────────────────────────────────────────────────────────

function ListingsGridView({ listings, mapsKey }: { listings: ListingForResults[]; mapsKey: string }) {
  return (
    <div className="listings__grid" style={{ marginBottom: '32px' }}>
      {listings.map((listing) => {
        const streetViewUrl = buildStreetViewUrl(listing, mapsKey, '600x280')
        return (
          <div key={listing.id} className="listing-card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Property image or placeholder */}
            <div style={{ height: '148px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              {streetViewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={streetViewUrl}
                  alt="Property street view"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background:
                    listing.assetType === 'RESIDENTIAL' ? 'linear-gradient(135deg, rgba(212,168,70,0.12) 0%, rgba(212,168,70,0.04) 100%)' :
                    listing.assetType === 'COMMERCIAL'  ? 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(96,165,250,0.04) 100%)' :
                    listing.assetType === 'CONSUMER'    ? 'linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.04) 100%)' :
                                                          'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.18 }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px',
                background: 'linear-gradient(to bottom, transparent, var(--bg-card))',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Card body */}
            <div style={{ padding: '16px 24px 24px' }}>
              <div className="listing-card__header">
                <span className={`listing-card__type listing-card__type--${TYPE_CLASS[listing.assetType]}`}>
                  {listing.assetType.charAt(0) + listing.assetType.slice(1).toLowerCase()}
                </span>
                <span className={`listing-card__status listing-card__status--${STATUS_CLASS[listing.status]}`}>
                  {listing.status.replace('_', ' ')}
                </span>
                {listing.lienPosition === 'SENIOR' && (
                  <span style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.05em' }}>
                    Senior
                  </span>
                )}
                {listing.lienPosition === 'JUNIOR' && (
                  <span style={{ background: 'rgba(251,146,60,0.08)', color: '#fb923c', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.05em' }}>
                    Junior
                  </span>
                )}
              </div>
              <h3 className="listing-card__title">{listing.title}</h3>
              <div className="listing-card__meta">
                <div className="listing-card__meta-item">
                  <span className="listing-card__meta-label">UPB</span>
                  <span className="listing-card__upb">{formatCurrency(listing.unpaidBalance)}</span>
                </div>
                <div className="listing-card__meta-item">
                  <span className="listing-card__meta-label">Loans</span>
                  <span className="listing-card__meta-value">{listing.loanCount.toLocaleString()}</span>
                </div>
                <div className="listing-card__meta-item">
                  <span className="listing-card__meta-label">Location</span>
                  <span className="listing-card__meta-value">{listing.location}{listing.zip ? ` ${listing.zip}` : ''}</span>
                </div>
                {listing.lienPosition != null && (
                  <div className="listing-card__meta-item">
                    <span className="listing-card__meta-label">Lien Position</span>
                    <span className="listing-card__meta-value">{listing.lienPosition === 'SENIOR' ? 'Senior' : 'Junior'}</span>
                  </div>
                )}
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
                <span className="listing-card__date">{timeAgo(new Date(listing.createdAt))}</span>
                <Link href={`/listings/${listing.id}`} className="btn btn--gold btn--sm">View Details</Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// List view (dense horizontal row, institutional)
// ──────────────────────────────────────────────────────────────────────────────

function ListingsListView({ listings, mapsKey }: { listings: ListingForResults[]; mapsKey: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
      {/* Header row */}
      <div className="listings-row listings-row--header" aria-hidden="true">
        <div className="listings-row__thumb" />
        <div className="listings-row__title-col">Listing</div>
        <div className="listings-row__metric">UPB</div>
        <div className="listings-row__metric">Loans</div>
        <div className="listings-row__metric listings-row__metric--wide">Location</div>
        <div className="listings-row__metric">Avg. Delinq.</div>
        <div className="listings-row__metric listings-row__metric--right">Listed</div>
        <div className="listings-row__cta" />
      </div>

      {listings.map((listing) => {
        const streetViewUrl = buildStreetViewUrl(listing, mapsKey, '160x160')
        return (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}`}
            className="listings-row listings-row--data glass-card"
          >
            {/* Thumbnail */}
            <div className="listings-row__thumb">
              {streetViewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={streetViewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div className={`listings-row__thumb-fallback listings-row__thumb-fallback--${TYPE_CLASS[listing.assetType]}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ opacity: 0.5 }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Title + badges */}
            <div className="listings-row__title-col">
              <div className="listings-row__badges">
                <span className={`listing-card__type listing-card__type--${TYPE_CLASS[listing.assetType]}`}>
                  {listing.assetType.charAt(0) + listing.assetType.slice(1).toLowerCase()}
                </span>
                <span className={`listing-card__status listing-card__status--${STATUS_CLASS[listing.status]}`}>
                  {listing.status.replace('_', ' ')}
                </span>
                {listing.lienPosition && (
                  <span style={{
                    fontSize: '0.62rem', padding: '2px 8px', borderRadius: '100px',
                    background: listing.lienPosition === 'SENIOR' ? 'rgba(96,165,250,0.08)' : 'rgba(251,146,60,0.08)',
                    color:      listing.lienPosition === 'SENIOR' ? '#60a5fa' : '#fb923c',
                    border:    `1px solid ${listing.lienPosition === 'SENIOR' ? 'rgba(96,165,250,0.2)' : 'rgba(251,146,60,0.2)'}`,
                    fontWeight: 500, letterSpacing: '0.04em',
                  }}>
                    {listing.lienPosition === 'SENIOR' ? '1st Mtg' : '2nd Mtg'}
                  </span>
                )}
              </div>
              <h3 className="listings-row__title">{listing.title}</h3>
              {listing.seller && (
                <div className="listings-row__seller">{listing.seller.company ?? listing.seller.name}</div>
              )}
            </div>

            {/* Metric columns */}
            <div className="listings-row__metric">
              <div className="listings-row__metric-value listings-row__metric-value--gold">{formatCurrency(listing.unpaidBalance)}</div>
            </div>
            <div className="listings-row__metric">
              <div className="listings-row__metric-value">{listing.loanCount.toLocaleString()}</div>
            </div>
            <div className="listings-row__metric listings-row__metric--wide">
              <div className="listings-row__metric-value listings-row__metric-value--ellipsis">
                {listing.location}{listing.zip ? ` ${listing.zip}` : ''}
              </div>
            </div>
            <div className="listings-row__metric">
              <div className="listings-row__metric-value">
                {listing.avgDelinquency != null ? `${listing.avgDelinquency} mo` : '—'}
              </div>
            </div>
            <div className="listings-row__metric listings-row__metric--right">
              <div className="listings-row__metric-value listings-row__metric-value--muted">{timeAgo(new Date(listing.createdAt))}</div>
            </div>

            {/* CTA */}
            <div className="listings-row__cta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
