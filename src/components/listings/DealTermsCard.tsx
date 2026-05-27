import { formatCurrency, timeAgo } from '@/lib/utils'

type Props = {
  unpaidBalance: number | null | undefined
  askingPrice: number | null | undefined
  reservePrice: number | null | undefined
  bidDeadline: Date | string | null | undefined
  preferredClosingDays: number | null | undefined
  listingNumber: string | null | undefined
  createdAt: Date | string
  showReserve?: boolean
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysFromNow(d: Date | string | null | undefined): number | null {
  if (!d) return null
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function DealTermsCard({
  unpaidBalance,
  askingPrice,
  reservePrice,
  bidDeadline,
  preferredClosingDays,
  listingNumber,
  createdAt,
  showReserve = false,
}: Props) {
  const hasAsking = askingPrice != null && askingPrice > 0
  const hasUpb    = unpaidBalance != null && unpaidBalance > 0

  // Derived metrics
  const centsOnUpb = hasAsking && hasUpb ? (askingPrice / unpaidBalance) * 100 : null
  const discount   = hasAsking && hasUpb ? unpaidBalance - askingPrice : null
  const discountPct = hasAsking && hasUpb ? ((unpaidBalance - askingPrice) / unpaidBalance) * 100 : null

  const bidDeadlineDays = daysFromNow(bidDeadline)
  const bidDeadlineUrgent = bidDeadlineDays != null && bidDeadlineDays >= 0 && bidDeadlineDays <= 7
  const bidDeadlinePast = bidDeadlineDays != null && bidDeadlineDays < 0

  // Spec rows
  type Row = { label: string; value: string; tone?: 'positive' | 'warning' | 'danger' }
  const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const rows: Array<Row | null> = [
    centsOnUpb != null ? { label: 'Cents on UPB', value: `${centsOnUpb.toFixed(1)}¢` } : null,
    discount != null && discount > 0
      ? {
          label: 'Discount vs UPB',
          value: `${formatCurrency(discount)}${discountPct != null ? ` (${discountPct.toFixed(1)}%)` : ''}`,
          tone: 'positive',
        }
      : null,
    bidDeadline
      ? {
          label: 'Bid Deadline',
          value: bidDeadlinePast
            ? `${fmtDate(bidDeadline)} (passed)`
            : `${fmtDate(bidDeadline)}${bidDeadlineDays != null ? ` (${bidDeadlineDays}d)` : ''}`,
          tone: bidDeadlinePast ? 'danger' : (bidDeadlineUrgent ? 'warning' : undefined),
        }
      : null,
    { label: 'Listed', value: timeAgo(createdAtDate) },
    listingNumber ? { label: 'Listing #', value: listingNumber } : null,
    preferredClosingDays != null
      ? { label: 'Preferred Closing', value: `${preferredClosingDays} days` }
      : null,
    showReserve && reservePrice != null
      ? { label: 'Reserve Price', value: formatCurrency(reservePrice) }
      : null,
  ]

  const presentRows = rows.filter((r): r is Row => r !== null)

  // If we have absolutely nothing useful, render nothing.
  if (!hasAsking && presentRows.length === 0) return null

  return (
    <div className="glass-card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--gold-400)',
        marginBottom: '14px',
      }}>
        Deal Terms
      </div>

      {/* Asking Price — hero metric, only when set */}
      {hasAsking && (
        <div style={{
          paddingBottom: '14px',
          marginBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}>
            Asking Price
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.55rem',
            fontWeight: 600,
            background: 'var(--gold-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatCurrency(askingPrice)}
          </div>
        </div>
      )}

      {/* Spec rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {presentRows.map(({ label, value, tone }) => {
          const color =
            tone === 'positive' ? '#34d399' :
            tone === 'warning'  ? '#fbbf24' :
            tone === 'danger'   ? '#f87171' :
                                  'var(--text-primary)'
          return (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              padding: '5px 0',
              minWidth: 0,
            }}>
              <span style={{
                fontSize: '0.77rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {label}
              </span>
              <span style={{
                flex: 1,
                borderBottom: '1px dotted rgba(212, 168, 70, 0.16)',
                alignSelf: 'flex-end',
                marginBottom: '5px',
                minWidth: '10px',
              }} aria-hidden="true" />
              <span style={{
                fontSize: '0.85rem',
                color,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum" 1',
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}>
                {value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
