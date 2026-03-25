import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { ListingsFilters } from '@/components/listings/ListingsFilters'
import type { AssetType, ListingStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Listings' }

const PAGE_SIZE = 12

interface SearchParams {
  assetType?: string
  status?: string
  region?: string
  upbMin?: string
  upbMax?: string
  page?: string
  mine?: string
}

export default async function ListingsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>
}) {
  const searchParams = await searchParamsPromise
  const session = await auth()
  const userId = session!.user.id

  const page    = Math.max(1, parseInt(searchParams.page ?? '1'))
  const mine    = searchParams.mine === 'true'
  const assetType = searchParams.assetType as AssetType | undefined
  const status    = searchParams.status as ListingStatus | undefined
  const region    = searchParams.region
  const upbMin    = searchParams.upbMin ? parseFloat(searchParams.upbMin) : undefined
  const upbMax    = searchParams.upbMax ? parseFloat(searchParams.upbMax) : undefined

  const where = {
    ...(mine ? { sellerId: userId } : { status: status ?? ('ACTIVE' as ListingStatus) }),
    ...(assetType ? { assetType } : {}),
    ...(status && mine ? { status } : {}),
    ...(region ? { region: { contains: region, mode: 'insensitive' as const } } : {}),
    ...(upbMin !== undefined || upbMax !== undefined
      ? {
          unpaidBalance: {
            ...(upbMin !== undefined ? { gte: upbMin } : {}),
            ...(upbMax !== undefined ? { lte: upbMax } : {}),
          },
        }
      : {}),
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, company: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ])

  const pages = Math.ceil(total / PAGE_SIZE)

  const TYPE_CLASS: Record<AssetType, string> = {
    RESIDENTIAL: 'residential',
    COMMERCIAL: 'commercial',
    CONSUMER: 'consumer',
    MIXED: 'mixed',
  }
  const STATUS_CLASS: Record<ListingStatus, string> = {
    ACTIVE: 'active',
    UNDER_REVIEW: 'review',
    PENDING: 'pending',
    DRAFT: 'pending',
    SOLD: 'active',
    ARCHIVED: 'pending',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '4px' }}>
            {mine ? 'My Listings' : 'Browse Listings'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {total} listing{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href={mine ? '/listings' : '/listings?mine=true'}
            className="btn btn--ghost btn--sm"
          >
            {mine ? 'All Listings' : 'My Listings'}
          </Link>
          {(session!.user.role === 'SELLER' || session!.user.role === 'ADMIN') && (
            <>
              <Link href="/listings/import" className="btn btn--ghost btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import
              </Link>
              <Link href="/listings/new" className="btn btn--gold btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Listing
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Client-side filter bar */}
      <ListingsFilters
        initialAssetType={assetType}
        initialStatus={status}
        initialRegion={region}
        initialUpbMin={upbMin}
        initialUpbMax={upbMax}
        mine={mine}
      />

      {/* Results grid */}
      {listings.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No listings match your current filters.</p>
          <Link href="/listings" className="btn btn--ghost btn--sm" style={{ marginTop: '16px' }}>
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="listings__grid" style={{ marginBottom: '32px' }}>
          {listings.map((listing) => (
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
                <span className="listing-card__date">
                  {timeAgo(listing.createdAt)}
                </span>
                <Link href={`/listings/${listing.id}`} className="btn btn--gold btn--sm">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
          {page > 1 && (
            <PaginationLink href={buildUrl(searchParams, page - 1)}>← Prev</PaginationLink>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <PaginationLink key={p} href={buildUrl(searchParams, p)} active={p === page}>
              {p}
            </PaginationLink>
          ))}
          {page < pages && (
            <PaginationLink href={buildUrl(searchParams, page + 1)}>Next →</PaginationLink>
          )}
        </div>
      )}
    </div>
  )
}

function buildUrl(params: SearchParams, page: number) {
  const q = new URLSearchParams()
  if (params.assetType) q.set('assetType', params.assetType)
  if (params.status) q.set('status', params.status)
  if (params.region) q.set('region', params.region)
  if (params.upbMin) q.set('upbMin', params.upbMin)
  if (params.upbMax) q.set('upbMax', params.upbMax)
  if (params.mine === 'true') q.set('mine', 'true')
  q.set('page', String(page))
  return `/listings?${q.toString()}`
}

function PaginationLink({
  href,
  children,
  active,
}: {
  href: string
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={active ? 'btn btn--gold btn--sm' : 'btn btn--ghost btn--sm'}
    >
      {children}
    </Link>
  )
}
