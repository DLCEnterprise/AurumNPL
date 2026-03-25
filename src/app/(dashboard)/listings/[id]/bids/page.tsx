import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { BidActions } from '@/components/listings/BidActions'

export const metadata: Metadata = { title: 'Bids' }

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'rgba(212,168,70,0.8)',
  ACCEPTED:  '#34d399',
  REJECTED:  '#f87171',
  WITHDRAWN: 'var(--text-muted)',
  COUNTERED: '#60a5fa',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Pending',
  ACCEPTED:  'Accepted',
  REJECTED:  'Declined',
  WITHDRAWN: 'Withdrawn',
  COUNTERED: 'Countered',
}

export default async function BidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId  = session!.user.id
  const isAdmin = session!.user.role === 'ADMIN'

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, title: true, sellerId: true, status: true },
  })
  if (!listing) notFound()

  const isSeller = listing.sellerId === userId
  if (!isSeller && !isAdmin) redirect(`/listings/${id}`)

  const bids = await prisma.bid.findMany({
    where: { listingId: id },
    include: { bidder: { select: { id: true, name: true, company: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const pendingCount = bids.filter((b) => b.status === 'PENDING').length

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Back */}
      <Link
        href={`/listings/${id}`}
        style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Listing
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
          Bids
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {listing.title} · {bids.length} bid{bids.length !== 1 ? 's' : ''}{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
        </p>
      </div>

      {bids.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No bids have been submitted yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bids.map((bid) => (
            <div key={bid.id} className="glass-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                {/* Left: bidder + details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212,168,70,0.1)', border: '1px solid rgba(212,168,70,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold-300)', flexShrink: 0 }}>
                      {(bid.bidder.company ?? bid.bidder.name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        {bid.bidder.company ?? bid.bidder.name}
                      </div>
                      {bid.bidder.company && bid.bidder.name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bid.bidder.name}</div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: STATUS_COLOR[bid.status] ?? 'var(--text-muted)' }}>
                      {STATUS_LABEL[bid.status] ?? bid.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: bid.message ? '12px' : '0' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '3px' }}>Bid Amount</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {formatCurrency(bid.amount)}
                      </div>
                    </div>
                    {bid.noteRate != null && (
                      <div>
                        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '3px' }}>Note Rate</div>
                        <div style={{ fontSize: '1rem', fontWeight: 500 }}>{bid.noteRate}%</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '3px' }}>Submitted</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{timeAgo(bid.createdAt)}</div>
                    </div>
                  </div>

                  {bid.message && (
                    <div style={{ marginTop: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                        {bid.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: actions */}
                <div style={{ flexShrink: 0 }}>
                  <BidActions listingId={id} bidId={bid.id} currentStatus={bid.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
