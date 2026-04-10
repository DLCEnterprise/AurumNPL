'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Skeleton'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  linkUrl: string | null
  readAt: string | null
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m} minute${m !== 1 ? 's' : ''} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h !== 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d !== 1 ? 's' : ''} ago`
}

function typeIcon(type: string) {
  switch (type) {
    case 'BID_RECEIVED':
    case 'BID_ACCEPTED':
    case 'BID_REJECTED':
    case 'BID_COUNTERED':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'MESSAGE':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      )
    case 'LISTING_APPROVED':
    case 'LISTING_PUBLISHED':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    case 'ACCOUNT_APPROVED':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      )
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      )
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/notifications')
      const data = await res.json()
      if (data.success) setNotifications(data.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async (n: Notification) => {
    if (!n.readAt) {
      await fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((x) => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)
      )
    }
    if (n.linkUrl) router.push(n.linkUrl)
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
  }

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.readAt) : notifications
  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <div style={{ maxWidth: '680px' }}>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '4px' }}>
            Notifications
          </h1>
          {!loading && unreadCount > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {unreadCount} unread
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Filter tabs */}
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                background: filter === f ? 'var(--gold-400)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: filter === f ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'none',
                color: 'var(--gold-400)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '48px 0' }}>
          <Spinner size={18} />
          <span>Loading notifications…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {displayed.map((n, i) => (
            <button
              key={n.id}
              onClick={() => markRead(n)}
              style={{
                display: 'flex',
                width: '100%',
                textAlign: 'left',
                padding: '16px 20px',
                gap: '14px',
                alignItems: 'flex-start',
                background: n.readAt ? 'transparent' : 'rgba(212,168,70,0.04)',
                border: 'none',
                borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: n.linkUrl ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (n.linkUrl) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = n.readAt ? 'transparent' : 'rgba(212,168,70,0.04)' }}
            >
              {/* Icon */}
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: n.readAt ? 'var(--bg-elevated)' : 'rgba(212,168,70,0.12)',
                color: n.readAt ? 'var(--text-muted)' : 'var(--gold-400)',
              }}>
                {typeIcon(n.type)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: n.readAt ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontWeight: n.readAt ? 400 : 500,
                    lineHeight: 1.4,
                  }}>
                    {n.title}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                {n.body && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.5 }}>
                    {n.body}
                  </p>
                )}
              </div>

              {/* Unread dot */}
              {!n.readAt && (
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--gold-400)', flexShrink: 0, marginTop: '6px',
                }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
