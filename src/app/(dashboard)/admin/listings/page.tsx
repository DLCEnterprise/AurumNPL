import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { redirect } from 'next/navigation'
import { formatCurrency, timeAgo } from '@/lib/utils'
import type { ListingStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Admin — Listings' }

const STATUS_STYLE: Record<ListingStatus, { bg: string; color: string; border: string }> = {
  ACTIVE: {
    bg: 'rgba(34,197,94,0.08)',
    color: '#4ade80',
    border: 'rgba(34,197,94,0.25)',
  },
  DRAFT: {
    bg: 'rgba(113,113,122,0.1)',
    color: '#a1a1aa',
    border: 'rgba(113,113,122,0.25)',
  },
  UNDER_REVIEW: {
    bg: 'rgba(59,130,246,0.08)',
    color: '#60a5fa',
    border: 'rgba(59,130,246,0.25)',
  },
  PENDING: {
    bg: 'rgba(212,168,70,0.1)',
    color: 'var(--gold-300)',
    border: 'rgba(212,168,70,0.3)',
  },
  SOLD: {
    bg: 'rgba(168,85,247,0.08)',
    color: '#c084fc',
    border: 'rgba(168,85,247,0.25)',
  },
  ARCHIVED: {
    bg: 'rgba(113,113,122,0.06)',
    color: '#71717a',
    border: 'rgba(113,113,122,0.15)',
  },
}

const PAGE_SIZE = 25

interface SearchParams {
  page?: string
  status?: string
}

export default async function AdminListingsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAdmin()
  if (!session) redirect('/dashboard')

  const searchParams = await searchParamsPromise
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      include: {
        seller: { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count(),
  ])

  const pages = Math.ceil(total / PAGE_SIZE)

  function buildPageHref(p: number) {
    return `/admin/listings?page=${p}`
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '4px' }}>
          All Listings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {total} listing{total !== 1 ? 's' : ''} across all sellers
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No listings found.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                {['Title', 'Seller', 'Type', 'Status', 'UPB', 'Loans', 'Created', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, i) => {
                const statusStyle = STATUS_STYLE[listing.status]
                return (
                  <tr
                    key={listing.id}
                    style={{ borderBottom: i < listings.length - 1 ? '1px solid var(--border-light)' : undefined }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500, maxWidth: '220px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {listing.title}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {listing.seller?.company ?? listing.seller?.name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`listing-card__type listing-card__type--${listing.assetType.toLowerCase()}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {listing.assetType.charAt(0) + listing.assetType.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                      }}>
                        {listing.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500 }}>
                      {formatCurrency(listing.unpaidBalance)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {listing.loanCount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {timeAgo(listing.createdAt)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="btn btn--ghost btn--sm"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
          {page > 1 && (
            <Link href={buildPageHref(page - 1)} className="btn btn--ghost btn--sm">← Prev</Link>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildPageHref(p)}
              className={p === page ? 'btn btn--gold btn--sm' : 'btn btn--ghost btn--sm'}
            >
              {p}
            </Link>
          ))}
          {page < pages && (
            <Link href={buildPageHref(page + 1)} className="btn btn--ghost btn--sm">Next →</Link>
          )}
        </div>
      )}
    </div>
  )
}
