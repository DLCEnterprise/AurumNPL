import type { Metadata } from 'next'
import { requireSession } from '@/lib/session-guard'
import { prisma } from '@/lib/prisma'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { DealTimeline } from '@/components/deals/DealTimeline'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

export const metadata: Metadata = { title: 'My Deals' }

export default async function DealsPage() {
  const session = await requireSession()
  const userId  = session.user.id
  const role    = session.user.role
  const isAdmin = role === 'ADMIN'
  const isSeller = role === 'SELLER' || role === 'SELLER_BUYER' || isAdmin

  // Buyers see deals where they are the buyer
  // Sellers/admins see deals where they are the seller (or all deals for admin)
  const timelines = await prisma.dueDiligenceTimeline.findMany({
    where: isSeller
      ? (isAdmin ? {} : { listing: { sellerId: userId } })
      : { buyerId: userId },
    include: {
      listing: {
        select: {
          id: true, title: true, status: true,
          seller: { select: { id: true, name: true, company: true } },
          asset: { select: { propertyStreet: true, propertyCity: true, propertyState: true, propertyZip: true } },
        },
      },
      bid: { select: { amount: true, offerNumber: true } },
      buyer: { select: { id: true, name: true, company: true, email: true, fundType: true } },
    },
    orderBy: { bidAcceptedAt: 'desc' },
  })

  const STATUS_LABEL: Record<string, string> = {
    OFFER_ACCEPTED: 'Offer Accepted',
    DUE_DILIGENCE:  'Due Diligence',
    CLOSING:        'Closing',
    SOLD:           'Closed',
  }

  return (
    <div style={{ maxWidth: '860px' }}>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Deals' }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
            {isSeller ? 'Active Deals' : 'My Deals'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {timelines.length} deal{timelines.length !== 1 ? 's' : ''} in progress
          </p>
        </div>
      </div>

      {timelines.length === 0 ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
          title="No active deals"
          description={isSeller ? 'Deals appear here when you accept a bid on a listing.' : 'When a seller accepts your bid, the deal appears here with the full closing timeline.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {timelines.map((tl) => {
            const address = [
              tl.listing.asset?.propertyStreet,
              tl.listing.asset?.propertyCity,
              tl.listing.asset?.propertyState,
            ].filter(Boolean).join(', ')

            return (
              <div key={tl.id} className="glass-card" style={{ overflow: 'hidden' }}>
                {/* Deal header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600 }}>
                          {STATUS_LABEL[tl.listing.status] ?? tl.listing.status.replace(/_/g, ' ')}
                        </span>
                        {tl.bid.offerNumber && (
                          <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '100px', border: '1px solid var(--border)' }}>
                            {tl.bid.offerNumber}
                          </span>
                        )}
                      </div>
                      <Link href={`/listings/${tl.listing.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, marginBottom: '2px', color: 'var(--text-primary)' }}>
                          {tl.listing.title}
                        </h3>
                      </Link>
                      {address && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{address}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '2px' }}>Accepted Bid</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(tl.bid.amount)}
                      </div>
                    </div>
                  </div>

                  {/* Parties row */}
                  <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Seller: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{tl.listing.seller.company ?? tl.listing.seller.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Buyer: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{tl.buyer.company ?? tl.buyer.name}</span>
                      {tl.buyer.fundType && (
                        <span style={{ marginLeft: '6px', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '100px', background: tl.buyer.fundType === 'BUSINESS' ? 'rgba(59,130,246,0.1)' : 'rgba(168,85,247,0.08)', color: tl.buyer.fundType === 'BUSINESS' ? '#60a5fa' : '#c084fc', border: `1px solid ${tl.buyer.fundType === 'BUSINESS' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)'}` }}>
                          {tl.buyer.fundType === 'BUSINESS' ? 'Business' : 'Personal'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ padding: '20px 24px' }}>
                  <DealTimeline
                    timelineId={tl.id}
                    isSeller={isSeller}
                    bidAcceptedAt={tl.bidAcceptedAt.toISOString()}
                    bpoOeDeadline={tl.bpoOeDeadline.toISOString()}
                    bpoOrderedAt={tl.bpoOrderedAt?.toISOString() ?? null}
                    oeOrderedAt={tl.oeOrderedAt?.toISOString() ?? null}
                    ddDeadline={tl.ddDeadline.toISOString()}
                    ddCompletedAt={tl.ddCompletedAt?.toISOString() ?? null}
                    mlpaSentAt={tl.mlpaSentAt?.toISOString() ?? null}
                    mlpaSignedAt={tl.mlpaSignedAt?.toISOString() ?? null}
                    wireReceivedAt={tl.wireReceivedAt?.toISOString() ?? null}
                    closedAt={tl.closedAt?.toISOString() ?? null}
                    notes={tl.notes ?? null}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
