import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireSession } from '@/lib/session-guard'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { ContactSellerButton } from '@/components/listings/ContactSellerButton'
import { ArchiveListingButton } from '@/components/listings/ArchiveListingButton'
import { UnarchiveListingButton } from '@/components/listings/UnarchiveListingButton'
import { MarkAsSoldButton } from '@/components/listings/MarkAsSoldButton'
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
import { YieldCalculatorModal } from '@/components/tools/YieldCalculatorModal'
import type { YieldPrefill } from '@/components/tools/YieldCalculator'

export const metadata: Metadata = { title: 'Listing Detail' }

const TYPE_CLASS: Record<AssetType, string> = {
  RESIDENTIAL: 'residential', COMMERCIAL: 'commercial', CONSUMER: 'consumer', MIXED: 'mixed',
}
const STATUS_CLASS: Record<ListingStatus, string> = {
  ACTIVE: 'active', UNDER_REVIEW: 'review', PENDING: 'pending',
  DRAFT: 'pending', SOLD: 'active', ARCHIVED: 'pending',
  OFFER_ACCEPTED: 'active', DUE_DILIGENCE: 'review', CLOSING: 'review',
}

const STATUS_LABEL: Partial<Record<ListingStatus, string>> = {
  OFFER_ACCEPTED: 'Offer Accepted',
  DUE_DILIGENCE:  'Due Diligence',
  CLOSING:        'Closing',
}

const BID_STATUS_COLOR: Record<string, string> = {
  PENDING:   '#d4a846',
  ACCEPTED:  '#34d399',
  REJECTED:  '#f87171',
  WITHDRAWN: '#71717a',
  COUNTERED: '#fb923c',
}
const BID_STATUS_BG: Record<string, string> = {
  PENDING:   'rgba(212,168,70,0.1)',
  ACCEPTED:  'rgba(52,211,153,0.1)',
  REJECTED:  'rgba(248,113,113,0.1)',
  WITHDRAWN: 'rgba(255,255,255,0.04)',
  COUNTERED: 'rgba(251,146,60,0.1)',
}
const BID_STATUS_BORDER: Record<string, string> = {
  PENDING:   'rgba(212,168,70,0.25)',
  ACCEPTED:  'rgba(52,211,153,0.25)',
  REJECTED:  'rgba(248,113,113,0.25)',
  WITHDRAWN: 'rgba(255,255,255,0.06)',
  COUNTERED: 'rgba(251,146,60,0.25)',
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
  const session = await requireSession()
  const userId = session.user.id

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, company: true, email: true } },
      asset: true,
    },
  })

  if (!listing) notFound()

  const isOwner = listing.sellerId === userId
  const isAdmin = session.user.role === 'ADMIN'
  const isBuyer = session.user.role === 'BUYER' || session.user.role === 'SELLER_BUYER'

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

  // Yield calculator prefill from asset data
  const yieldPrefill: YieldPrefill | undefined = listing.asset ? (() => {
    const a = listing.asset!
    const payment = (a as { firstMtg_isModified?: boolean | null }).firstMtg_isModified
      ? ((a as { firstMtg_modMonthlyPI?: number | null }).firstMtg_modMonthlyPI ?? (a as { firstMtg_monthlyPI?: number | null }).firstMtg_monthlyPI ?? undefined)
      : ((a as { firstMtg_monthlyPI?: number | null }).firstMtg_monthlyPI ?? undefined)
    const months = (a as { firstMtg_isModified?: boolean | null }).firstMtg_isModified
      ? ((a as { firstMtg_modPaymentsRemaining?: number | null }).firstMtg_modPaymentsRemaining ?? (a as { firstMtg_monthsRemaining?: number | null }).firstMtg_monthsRemaining ?? undefined)
      : ((a as { firstMtg_monthsRemaining?: number | null }).firstMtg_monthsRemaining ?? undefined)
    return (payment || months) ? { paymentAmount: payment ?? undefined, durationMonths: months ?? undefined } : undefined
  })() : undefined

  // Prefer the asset's mortgage balance over the denormalized listing.unpaidBalance
  // so the header UPB always matches the First Mortgage Current Balance tile
  const effectiveUPB = (() => {
    if (!listing.asset) return listing.unpaidBalance
    const a = listing.asset as Record<string, unknown>
    if (listing.lienPosition === 'JUNIOR') {
      return (a.secondMtg_currentBalance ?? a.secondMtg_modCurrentBalance ?? listing.unpaidBalance) as number
    }
    return (a.firstMtg_currentBalance ?? a.firstMtg_modCurrentBalance ?? listing.unpaidBalance) as number
  })()

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
    <div style={{ maxWidth: '1100px' }}>
      <Breadcrumbs items={[{ label: 'Listings', href: '/listings' }, { label: listing.title }]} />

      <div className="listing-detail-layout">

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={{ minWidth: 0 }}>

          {/* Hero card */}
          <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(212,168,70,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              {/* Badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <span className={`listing-card__type listing-card__type--${TYPE_CLASS[listing.assetType]}`}>
                  {listing.assetType === 'RESIDENTIAL' ? 'Residential 1–4' : listing.assetType.charAt(0) + listing.assetType.slice(1).toLowerCase()}
                </span>
                <span className={`listing-card__status listing-card__status--${STATUS_CLASS[listing.status]}`}>
                  {STATUS_LABEL[listing.status] ?? listing.status.replace(/_/g, ' ')}
                </span>
                {listing.lienPosition && (
                  <span style={{ fontSize: '0.68rem', padding: '3px 9px', borderRadius: '100px', background: listing.lienPosition === 'SENIOR' ? 'rgba(59,130,246,0.1)' : 'rgba(251,146,60,0.1)', color: listing.lienPosition === 'SENIOR' ? '#60a5fa' : '#fb923c', border: `1px solid ${listing.lienPosition === 'SENIOR' ? 'rgba(59,130,246,0.2)' : 'rgba(251,146,60,0.2)'}` }}>
                    {listing.lienPosition === 'SENIOR' ? '1st Mortgage' : '2nd Mortgage'}
                  </span>
                )}
                {isOwner && (
                  <span style={{ fontSize: '0.68rem', padding: '3px 9px', borderRadius: '100px', background: 'rgba(212,168,70,0.08)', color: 'var(--gold-400)', border: '1px solid rgba(212,168,70,0.15)' }}>
                    Your Listing
                  </span>
                )}
                {(listing as { listingNumber?: string | null }).listingNumber && (
                  <span style={{ fontSize: '0.68rem', padding: '3px 9px', borderRadius: '100px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border-light)', fontFamily: 'monospace' }}>
                    {(listing as { listingNumber?: string | null }).listingNumber}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, marginBottom: '10px', lineHeight: 1.15 }}>
                {listing.title}
              </h1>

              {/* Address */}
              {asset?.propertyStreet && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 500 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {asset.propertyStreet}{asset.propertyCity ? `, ${asset.propertyCity}` : ''}{asset.propertyState ? `, ${asset.propertyState}` : ''}{asset.propertyZip ? ` ${asset.propertyZip}` : ''}
                </div>
              )}

              {/* Meta */}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
                Listed {timeAgo(listing.createdAt)} · {listing.seller.company ?? listing.seller.name}
              </p>

              {/* Deal tags */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(listing as { listingType?: string | null }).listingType && (
                  <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: '100px', background: 'rgba(212,168,70,0.06)', color: 'var(--gold-400)', border: '1px solid rgba(212,168,70,0.18)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {(listing as { listingType?: string | null }).listingType === 'portfolio' ? 'Portfolio' : 'Single Loan'}
                  </span>
                )}
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
                {(listing as { bidDeadline?: Date | null }).bidDeadline && (
                  <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: '100px', background: 'rgba(251,146,60,0.08)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)', letterSpacing: '0.03em' }}>
                    Bids due {new Date((listing as { bidDeadline?: Date | null }).bidDeadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metrics strip */}
          <div style={{ display: 'flex', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {[
              { label: 'Unpaid Balance', value: formatCurrency(effectiveUPB) },
              ...(((listing as { askingPrice?: number | null }).askingPrice) ? [{ label: 'Asking Price', value: formatCurrency((listing as { askingPrice?: number | null }).askingPrice!) }] : []),
              { label: 'Loan Count', value: listing.loanCount.toLocaleString() },
              ...(listing.lienPosition ? [{ label: 'Lien Position', value: listing.lienPosition === 'SENIOR' ? '1st Mtg' : '2nd Mtg' }] : []),
              ...(listing.avgDelinquency ? [{ label: 'Avg. Delinquency', value: `${listing.avgDelinquency} mo.` }] : []),
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{ flex: 1, padding: '16px 18px', borderRight: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none', minWidth: '80px' }}>
                <div style={{ fontSize: '0.61rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '5px' }}>{label}</div>
                <div style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Collateral Documents */}
          {listing.dropboxLink && (canSeeDropbox ? (
            <div className="glass-card" style={{ padding: '18px 24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '0.78rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Collateral Documents</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Access the shared document folder for this listing.</p>
                </div>
                <a href={listing.dropboxLink} target="_blank" rel="noopener noreferrer" className="btn btn--gold btn--sm">
                  Open in Dropbox →
                </a>
              </div>
            </div>
          ) : isBuyer ? (
            <div style={{ marginBottom: '16px' }}>
              <NdaGate listingId={id} dropboxLink={listing.dropboxLink} />
            </div>
          ) : null)}

          {/* Asset detail or portfolio-level metrics */}
          {!asset ? (
            <>
              {/* Headline metrics — the Portfolio Snapshot card */}
              <div className="glass-card" style={{ padding: '28px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
                  {[
                    { label: 'Unpaid Balance (UPB)', value: formatCurrency(listing.unpaidBalance) },
                    { label: 'Number of Loans', value: listing.loanCount.toLocaleString() },
                    { label: 'Location', value: listing.location },
                    { label: 'Avg. Delinquency', value: listing.avgDelinquency != null ? `${listing.avgDelinquency} months` : '—' },
                    { label: 'Lien Position', value: listing.lienPosition === 'SENIOR' ? 'Senior (1st Mortgage)' : listing.lienPosition === 'JUNIOR' ? 'Junior (2nd Mortgage)' : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Overview — structured aggregates */}
              {(listing.originalUpb != null || listing.avgInterestRate != null || listing.avgLTV != null || listing.avgCLTV != null || listing.propertyMix || listing.stateConcentration || listing.pctNonPerforming != null || listing.pctPerforming != null) && (
                <div className="glass-card" style={{ padding: '28px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '18px' }}>Portfolio Overview</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px 28px' }}>
                    {[
                      listing.originalUpb     != null && { label: 'Original UPB',          value: formatCurrency(listing.originalUpb) },
                      listing.unpaidBalance   != null && listing.originalUpb != null && { label: 'Paid-Down Ratio', value: `${(((listing.originalUpb - listing.unpaidBalance) / listing.originalUpb) * 100).toFixed(1)}%` },
                      listing.avgInterestRate != null && { label: 'Weighted Avg Coupon', value: `${listing.avgInterestRate.toFixed(3)}%` },
                      listing.avgLTV          != null && { label: 'Avg LTV',              value: `${listing.avgLTV.toFixed(1)}%` },
                      listing.avgCLTV         != null && { label: 'Avg CLTV',             value: `${listing.avgCLTV.toFixed(1)}%` },
                      (listing.pctNonPerforming != null || listing.pctPerforming != null) && {
                        label: 'Performance Mix',
                        value: [
                          listing.pctNonPerforming ? `${listing.pctNonPerforming}% NPL` : null,
                          listing.pctPerforming    ? `${listing.pctPerforming}% Perf.`  : null,
                        ].filter(Boolean).join(' · ') || '—',
                      },
                      listing.askingPrice != null && listing.unpaidBalance > 0 && {
                        label: 'Asking / UPB',
                        value: `${((listing.askingPrice / listing.unpaidBalance) * 100).toFixed(1)}¢`,
                      },
                      listing.noteType && { label: 'Note Type', value: listing.noteType },
                    ].filter(Boolean).map((item) => {
                      const { label, value } = item as { label: string; value: string }
                      return (
                        <div key={label}>
                          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                        </div>
                      )
                    })}
                  </div>

                  {(listing.propertyMix || listing.stateConcentration) && (
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px 28px' }}>
                      {listing.propertyMix && (
                        <div>
                          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>Property Mix</div>
                          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{listing.propertyMix}</div>
                        </div>
                      )}
                      {listing.stateConcentration && (
                        <div>
                          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>State Concentration</div>
                          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{listing.stateConcentration}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {listing.description && (
                <div className="glass-card" style={{ padding: '28px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '12px' }}>Description</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>{listing.description}</p>
                </div>
              )}

              {/* Available upon NDA — gated deliverables callout */}
              {listing.ndaRequired && !isOwner && !isAdmin && (
                <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '16px', border: '1px solid rgba(212,168,70,0.18)', background: 'rgba(212,168,70,0.025)' }}>
                  <h3 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--gold-300)', marginBottom: '14px' }}>Available Upon NDA Execution</h3>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.85 }}>
                    <li>Loan-level data tape (CSV) with per-asset terms, balances, and payment histories</li>
                    <li>Collateral files: notes, mortgages, modifications, assignments</li>
                    <li>BPO reports and property condition summaries per asset</li>
                    <li>Title and ownership encumbrance reports where ordered</li>
                    <li>Servicer comments and loss-mitigation timelines</li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <AssetDetail asset={asset} />
          )}

          {/* Bid Activity */}
          {(isOwner || isAdmin) && bidHistory.length > 0 && (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-400)', margin: 0 }}>
                  Bid Activity
                </h3>
                {bidCount > 10 && (
                  <Link href={`/listings/${id}/bids`} style={{ fontSize: '0.8rem', color: 'var(--gold-400)', textDecoration: 'none' }}>
                    View All →
                  </Link>
                )}
              </div>
              <div>
                {bidHistory.map((bid, index) => {
                  const bidderName = bid.bidder.company ?? bid.bidder.name ?? 'Unknown'
                  return (
                    <div
                      key={bid.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 0',
                        borderBottom: index < bidHistory.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: BID_STATUS_BG[bid.status] ?? 'rgba(255,255,255,0.06)',
                        border: `1px solid ${BID_STATUS_BORDER[bid.status] ?? 'rgba(255,255,255,0.1)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700,
                        color: BID_STATUS_COLOR[bid.status] ?? 'var(--text-muted)',
                        flexShrink: 0,
                      }}>
                        {bidderName.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Bidder info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {bidderName}
                        </div>
                        {bid.bidder.company && bid.bidder.name && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{bid.bidder.name}</div>
                        )}
                      </div>

                      {/* Counter amount */}
                      {(bid as { counterAmount?: number | null }).counterAmount && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.6rem', color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1px' }}>Counter</div>
                          <div style={{ fontSize: '0.82rem', color: '#fb923c', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency((bid as { counterAmount?: number | null }).counterAmount!)}
                          </div>
                        </div>
                      )}

                      {/* Bid amount */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1px' }}>Bid</div>
                        <div style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(bid.amount)}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        fontSize: '0.68rem', padding: '3px 10px', borderRadius: '100px', flexShrink: 0, fontWeight: 500,
                        background: BID_STATUS_BG[bid.status] ?? 'rgba(255,255,255,0.04)',
                        border: `1px solid ${BID_STATUS_BORDER[bid.status] ?? 'rgba(255,255,255,0.06)'}`,
                        color: BID_STATUS_COLOR[bid.status] ?? 'var(--text-muted)',
                      }}>
                        {BID_STATUS_LABEL[bid.status] ?? bid.status}
                      </span>

                      {/* Date */}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                        <div>{timeAgo(bid.createdAt)}</div>
                        <div style={{ marginTop: '1px', opacity: 0.7 }}>
                          {new Date(bid.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div className="listing-detail-sticky">

          {/* Action panel */}
          <div className="glass-card" style={{ padding: '24px', borderTop: '2px solid var(--gold-400)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(212,168,70,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Price header */}
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.61rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Unpaid Balance
              </div>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 600, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1, marginBottom: '4px' }}>
                {formatCurrency(effectiveUPB)}
              </div>
              {(listing as { askingPrice?: number | null }).askingPrice && (
                <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#34d399', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {formatCurrency((listing as { askingPrice?: number | null }).askingPrice!)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>asking</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {!isOwner && isBuyer && listing.status === 'ACTIVE' && (
                <BidButton listingId={listing.id} existingBid={serializedBid} />
              )}
              {!isOwner && (
                <ContactSellerButton sellerId={listing.seller.id} listingId={listing.id} listingTitle={listing.title} />
              )}
              {!isOwner && (
                <YieldCalculatorModal prefill={yieldPrefill} />
              )}
              {!isOwner && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <SaveListingButton listingId={listing.id} initialSaved={isSaved} />
                  {isBuyer && <AddToPipelineButton listingId={listing.id} />}
                </div>
              )}
              {isOwner && (
                <>
                  {listing.status === 'DRAFT' && <PublishListingButton listingId={listing.id} />}
                  <Link href={`/listings/${listing.id}/edit`} className="btn btn--ghost" style={{ justifyContent: 'center' }}>
                    Edit Listing
                  </Link>
                  <Link href={`/listings/${listing.id}/bids`} className="btn btn--ghost" style={{ justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    View Bids{bidCount > 0 ? ` (${bidCount})` : ''}
                  </Link>
                  {listing.status !== 'SOLD' && listing.status !== 'ARCHIVED' && (
                    <MarkAsSoldButton listingId={listing.id} />
                  )}
                  {listing.status !== 'ARCHIVED'
                    ? <ArchiveListingButton listingId={listing.id} />
                    : <UnarchiveListingButton listingId={listing.id} />
                  }
                </>
              )}
            </div>

            {/* Seller */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div style={{ fontSize: '0.61rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Seller
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(212,168,70,0.12)', border: '1px solid rgba(212,168,70,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-300)', flexShrink: 0,
                }}>
                  {(listing.seller.company ?? listing.seller.name ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {listing.seller.company ?? listing.seller.name}
                  </div>
                  {listing.seller.company && listing.seller.name && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>{listing.seller.name}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analytics card */}
          {(isOwner || isAdmin) && <ListingAnalyticsCard listingId={id} />}

        </div>
      </div>

      <ViewTracker listingId={id} />
    </div>
  )
}
