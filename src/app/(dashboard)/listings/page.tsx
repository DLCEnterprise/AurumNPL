import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { ListingsFilters } from '@/components/listings/ListingsFilters'
import { EmptyState } from '@/components/ui/EmptyState'
import { ExportButton } from '@/components/ui/ExportButton'
import type { AssetType, ListingStatus, LienPosition } from '@prisma/client'

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
  q?: string
  delinquencyMin?: string
  delinquencyMax?: string
  sortBy?: string
  lienPosition?: string
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
  const q              = searchParams.q
  const delinquencyMin = searchParams.delinquencyMin ? parseInt(searchParams.delinquencyMin) : undefined
  const delinquencyMax = searchParams.delinquencyMax ? parseInt(searchParams.delinquencyMax) : undefined
  const sortBy         = searchParams.sortBy ?? 'newest'
  const lienPosition   = searchParams.lienPosition as LienPosition | undefined

  const VALID_LIEN_POSITIONS: LienPosition[] = ['SENIOR', 'JUNIOR']
  const validatedLienPosition = lienPosition && VALID_LIEN_POSITIONS.includes(lienPosition) ? lienPosition : undefined

  const orderBy = sortBy === 'upbAsc' ? { unpaidBalance: 'asc' as const }
    : sortBy === 'upbDesc' ? { unpaidBalance: 'desc' as const }
    : sortBy === 'delinquencyAsc' ? { avgDelinquency: 'asc' as const }
    : sortBy === 'delinquencyDesc' ? { avgDelinquency: 'desc' as const }
    : { createdAt: 'desc' as const }

  const where = {
    ...(mine ? { sellerId: userId } : { status: status ?? ('ACTIVE' as ListingStatus) }),
    ...(assetType ? { assetType } : {}),
    ...(status && mine ? { status } : {}),
    ...(region ? { region: { contains: region, mode: 'insensitive' as const } } : {}),
    ...(validatedLienPosition ? { lienPosition: validatedLienPosition } : {}),
    ...(upbMin !== undefined || upbMax !== undefined
      ? {
          unpaidBalance: {
            ...(upbMin !== undefined ? { gte: upbMin } : {}),
            ...(upbMax !== undefined ? { lte: upbMax } : {}),
          },
        }
      : {}),
    ...(delinquencyMin !== undefined || delinquencyMax !== undefined ? {
      avgDelinquency: {
        ...(delinquencyMin !== undefined ? { gte: delinquencyMin } : {}),
        ...(delinquencyMax !== undefined ? { lte: delinquencyMax } : {}),
      }
    } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { location: { contains: q, mode: 'insensitive' as const } },
      ]
    } : {}),
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, company: true } } },
      orderBy,
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
              <ExportButton type="listings" label="Export CSV" />
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
        initialQ={q}
        initialSortBy={sortBy}
        initialDelinquencyMin={delinquencyMin}
        initialDelinquencyMax={delinquencyMax}
        initialLienPosition={validatedLienPosition}
        mine={mine}
      />

      {/* Results grid */}
      {listings.length === 0 ? (
        mine ? (
          <EmptyState
            icon={
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            }
            title="No listings yet"
            description="Create your first portfolio listing."
            actionLabel="Create Listing"
            actionHref="/listings/new"
          />
        ) : (
          <EmptyState
            icon={
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            }
            title="No listings found"
            description="Try adjusting your filters or search terms."
            actionLabel="Clear Filters"
            actionHref="/listings"
          />
        )
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
  const qs = new URLSearchParams()
  if (params.assetType) qs.set('assetType', params.assetType)
  if (params.status) qs.set('status', params.status)
  if (params.region) qs.set('region', params.region)
  if (params.upbMin) qs.set('upbMin', params.upbMin)
  if (params.upbMax) qs.set('upbMax', params.upbMax)
  if (params.mine === 'true') qs.set('mine', 'true')
  if (params.q) qs.set('q', params.q)
  if (params.delinquencyMin) qs.set('delinquencyMin', params.delinquencyMin)
  if (params.delinquencyMax) qs.set('delinquencyMax', params.delinquencyMax)
  if (params.sortBy && params.sortBy !== 'newest') qs.set('sortBy', params.sortBy)
  if (params.lienPosition) qs.set('lienPosition', params.lienPosition)
  qs.set('page', String(page))
  return `/listings?${qs.toString()}`
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
