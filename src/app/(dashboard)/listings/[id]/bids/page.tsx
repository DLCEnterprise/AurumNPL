import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { BidActions } from '@/components/listings/BidActions'
import { ExportButton } from '@/components/ui/ExportButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const metadata: Metadata = { title: 'Bids' }

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'rgba(212,168,70,0.8)',
  ACCEPTED:  '#34d399',
  REJECTED:  '#f87171',
  WITHDRAWN: 'var(--text-muted)',
  COUNTERED: '#fb923c',
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
    include: { bidder: { select: { id: true, name: true, company: true, email: true, fundType: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const pendingCount = bids.filter((b) => b.status === 'PENDING').length

  return (
    <div style={{ maxWidth: '860px' }}>
      <Breadcrumbs
        items={[
          { label: 'Listings', href: '/listings' },
          { label: listing.title, href: `/listings/${id}` },
          { label: 'Bids' },
        ]}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
            Bids
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {listing.title} · {bids.length} bid{bids.length !== 1 ? 's' : ''}{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
          </p>
        </div>
        <ExportButton type="bids" label="Export CSV" />
      </div>

      {bids.length === 0 ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
              <line x1="12" y1="12" x2="12" y2="18" />
            </svg>
          }
          title="No bids yet"
          description="Bids will appear here when buyers submit offers."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bids.map((bid) => {
            const expiry = formatExpiry(bid.expiresAt)
            return (
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

                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: (bid.message || bid.counterAmount != null) ? '12px' : '0' }}>
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
                      {(bid as { fundType?: string | null }).fundType && (
                        <div>
                          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '3px' }}>Fund Type</div>
                          <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '100px', fontWeight: 600, background: (bid as { fundType?: string | null }).fundType === 'BUSINESS' ? 'rgba(59,130,246,0.1)' : 'rgba(168,85,247,0.08)', color: (bid as { fundType?: string | null }).fundType === 'BUSINESS' ? '#60a5fa' : '#c084fc', border: `1px solid ${(bid as { fundType?: string | null }).fundType === 'BUSINESS' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)'}` }}>
                            {(bid as { fundType?: string | null }).fundType === 'BUSINESS' ? 'Business / Entity' : 'Personal'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '3px' }}>Submitted</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{timeAgo(bid.createdAt)}</div>
                      </div>
                      {expiry && bid.status === 'PENDING' && (
                        <div>
                          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '3px' }}>Expiry</div>
                          <div style={{ fontSize: '0.85rem', color: expiry.color }}>{expiry.label}</div>
                        </div>
                      )}
                      {(bid as { offerNumber?: string | null }).offerNumber && (
                        <div>
                          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '3px' }}>Offer #</div>
                          <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{(bid as { offerNumber?: string | null }).offerNumber}</div>
                        </div>
                      )}
                    </div>

                    {bid.message && (
                      <div style={{ marginTop: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                          {bid.message}
                        </p>
                      </div>
                    )}

                    {/* Counter offer — show full original → counter progression */}
                    {bid.counterAmount != null && (
                      <div style={{ marginTop: '12px', padding: '14px 16px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fb923c', marginBottom: '10px' }}>
                          Counter Offer · {timeAgo(bid.updatedAt)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: bid.counterNote ? '10px' : '0' }}>
                          <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Original</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              {formatCurrency(bid.amount)}
                            </div>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                          <div>
                            <div style={{ fontSize: '0.65rem', color: '#fb923c', marginBottom: '2px' }}>Counter</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500, color: '#fb923c' }}>
                              {formatCurrency(bid.counterAmount)}
                            </div>
                          </div>
                          {bid.counterAmount !== bid.amount && (
                            <div style={{ marginLeft: 'auto' }}>
                              <span style={{
                                fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 600,
                                background: bid.counterAmount > bid.amount ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                color: bid.counterAmount > bid.amount ? '#4ade80' : '#f87171',
                                border: `1px solid ${bid.counterAmount > bid.amount ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                              }}>
                                {bid.counterAmount > bid.amount ? '+' : ''}
                                {formatCurrency(bid.counterAmount - bid.amount)}
                              </span>
                            </div>
                          )}
                        </div>
                        {bid.counterNote && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                            {bid.counterNote}
                          </p>
                        )}
                        {bid.status === 'COUNTERED' && (
                          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Awaiting buyer response
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div style={{ flexShrink: 0 }}>
                    <BidActions listingId={id} bidId={bid.id} currentStatus={bid.status} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatExpiry(expiresAt: Date | null): { label: string; color: string } | null {
  if (!expiresAt) return null
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms < 0) return { label: 'Expired', color: '#ef4444' }
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours < 48) return { label: `Expires in ${hours}h`, color: '#fb923c' }
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  return { label: `Expires in ${days} days`, color: 'var(--text-muted)' }
}
