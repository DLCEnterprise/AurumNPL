'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  linkUrl: string | null
  readAt: string | null
  createdAt: string
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function NotificationBell() {
  const router = useRouter()
  const [unread, setUnread]           = useState(0)
  const [open, setOpen]               = useState(false)
  const [notifications, setNotifs]    = useState<Notification[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Poll unread count every 30 s
  const fetchCount = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications?count=true')
      const data = await res.json()
      if (data.success) setUnread(data.data.count)
    } catch { /* silently ignore network errors */ }
  }, [])

  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    return () => clearInterval(id)
  }, [fetchCount])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openDropdown = async () => {
    setOpen((v) => !v)
    if (!open) {
      setLoadingList(true)
      try {
        const res  = await fetch('/api/notifications')
        const data = await res.json()
        if (data.success) setNotifs(data.data.slice(0, 20))
      } finally {
        setLoadingList(false)
      }
    }
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setUnread(0)
    setNotifs((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
  }

  const markRead = async (n: Notification) => {
    if (!n.readAt) {
      await fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })
      setUnread((c) => Math.max(0, c - 1))
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
    }
    setOpen(false)
    if (n.linkUrl) router.push(n.linkUrl)
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={openDropdown}
        aria-label="Notifications"
        style={{
          position: 'relative',
          display:  'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          flexShrink: 0,
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px', right: '-4px',
            minWidth: '18px', height: '18px',
            background: 'var(--gold-400)',
            color: '#0a0a0a',
            fontSize: '0.62rem',
            fontWeight: 700,
            borderRadius: '100px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            lineHeight: 1,
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '340px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em' }}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', color: 'var(--gold-400)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loadingList ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: n.readAt ? 'transparent' : 'rgba(212,168,70,0.04)',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = n.readAt ? 'transparent' : 'rgba(212,168,70,0.04)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    {!n.readAt && (
                      <span style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: 'var(--gold-400)', flexShrink: 0, marginTop: '5px',
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: n.readAt ? '17px' : '0' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '2px', lineHeight: 1.4 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {timeAgoShort(n.createdAt)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
