import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/session-guard'
import { prisma } from '@/lib/prisma'
import { ListingsFilters } from '@/components/listings/ListingsFilters'
import { ListingResults, type ListingForResults } from '@/components/listings/ListingResults'
import { EmptyState } from '@/components/ui/EmptyState'
import { ExportButton } from '@/components/ui/ExportButton'
import type { AssetType, ListingStatus, LienPosition } from '@prisma/client'

export const metadata: Metadata = { title: 'Listings' }

const PAGE_SIZE = 12

interface SearchParams {
  assetType?: string
  status?: string
  state?: string
  region?: string  // legacy param from saved searches — treated as state alias
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
  const session = await requireSession()
  const userId = session.user.id

  const page    = Math.max(1, parseInt(searchParams.page ?? '1'))
  const mine    = searchParams.mine === 'true'
  const assetType = searchParams.assetType as AssetType | undefined
  const status    = searchParams.status as ListingStatus | undefined
  const state     = searchParams.state ?? searchParams.region  // region is legacy alias
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
    ...(state ? {
      OR: [
        { location: { contains: state, mode: 'insensitive' as const } },
        { asset: { propertyState: { equals: state, mode: 'insensitive' as const } } },
      ],
    } : {}),
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
      include: {
        seller: { select: { id: true, name: true, company: true } },
        asset: { select: { propertyStreet: true, propertyCity: true, propertyState: true, propertyZip: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ])

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  const pages = Math.ceil(total / PAGE_SIZE)

  // Serialise for the client renderer (dates → ISO strings)
  const serializedListings: ListingForResults[] = listings.map((l) => ({
    id:             l.id,
    title:          l.title,
    assetType:      l.assetType,
    status:         l.status,
    lienPosition:   l.lienPosition,
    unpaidBalance:  l.unpaidBalance,
    loanCount:      l.loanCount,
    location:       l.location,
    zip:            l.zip,
    avgDelinquency: l.avgDelinquency,
    createdAt:      l.createdAt.toISOString(),
    seller:         l.seller ? { company: l.seller.company, name: l.seller.name } : null,
    asset:          l.asset ? {
      propertyStreet: l.asset.propertyStreet,
      propertyCity:   l.asset.propertyCity,
      propertyState:  l.asset.propertyState,
      propertyZip:    l.asset.propertyZip,
    } : null,
  }))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, marginBottom: '4px' }}>
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
          {(session.user.role === 'SELLER' || session.user.role === 'ADMIN') && (
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
        initialState={state}
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
        <ListingResults listings={serializedListings} mapsKey={mapsKey} />
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
  if (params.state) qs.set('state', params.state)
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
