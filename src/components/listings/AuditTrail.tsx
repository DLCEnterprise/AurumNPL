'use client'

import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id:        string
  action:    string
  details:   string | null
  createdAt: string
  user:      { id: string; name: string | null } | null
}

interface Props {
  listingId: string
}

// ─── Action label map ─────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  'listing.created':  'Listing Created',
  'listing.updated':  'Listing Updated',
  'listing.viewed':   'Listing Viewed',
  'bid.placed':       'Bid Placed',
  'bid.accepted':     'Bid Accepted',
  'bid.rejected':     'Bid Rejected',
  'status.changed':   'Status Changed',
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ActionIcon({ action }: { action: string }) {
  const style: React.CSSProperties = {
    width:            28,
    height:           28,
    borderRadius:     '50%',
    display:          'flex',
    alignItems:       'center',
    justifyContent:   'center',
    flexShrink:       0,
    fontSize:         '0.75rem',
  }

  if (action === 'listing.created') {
    return (
      <div style={{ ...style, background: 'rgba(212,168,70,0.12)', color: 'var(--gold-400)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
    )
  }
  if (action === 'bid.placed') {
    return (
      <div style={{ ...style, background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
    )
  }
  if (action === 'bid.accepted') {
    return (
      <div style={{ ...style, background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
    )
  }
  if (action === 'bid.rejected') {
    return (
      <div style={{ ...style, background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
    )
  }
  if (action === 'listing.updated') {
    return (
      <div style={{ ...style, background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
    )
  }
  // Default: activity dot
  return (
    <div style={{ ...style, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="4" />
      </svg>
    </div>
  )
}

// ─── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30)    return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuditTrail({ listingId }: Props) {
  const [logs,    setLogs]    = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/listings/${listingId}/audit`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLogs(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [listingId])

  return (
    <div
      className="glass-card"
      style={{ padding: '24px 28px' }}
    >
      <div style={{
        fontSize:      '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color:         'var(--text-muted)',
        marginBottom:  '20px',
      }}>
        Audit Trail
      </div>

      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</div>
      )}

      {!loading && logs.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No activity recorded.
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {logs.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display:    'flex',
                gap:        '14px',
                alignItems: 'flex-start',
                position:   'relative',
                paddingBottom: i < logs.length - 1 ? '16px' : '0',
              }}
            >
              {/* Vertical connector line */}
              {i < logs.length - 1 && (
                <div style={{
                  position:   'absolute',
                  left:       13,
                  top:        28,
                  bottom:     0,
                  width:      1,
                  background: 'var(--border)',
                }} />
              )}

              <ActionIcon action={entry.action} />

              <div style={{ flex: 1, minWidth: 0, paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {actionLabel(entry.action)}
                  </span>
                  {entry.user?.name && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      by {entry.user.name}
                    </span>
                  )}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {relativeTime(entry.createdAt)}
                  </span>
                </div>
                {entry.details && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    {entry.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
