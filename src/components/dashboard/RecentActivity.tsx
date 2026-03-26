'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'

type ActivityEvent = {
  type: 'bid' | 'message' | 'notification'
  id: string
  title: string
  subtitle: string
  href: string
  createdAt: string
}

function BidIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a846" strokeWidth="2">
      <rect x="2" y="3" width="6" height="18" rx="1" />
      <rect x="9" y="8" width="6" height="13" rx="1" />
      <rect x="16" y="13" width="6" height="8" rx="1" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a846" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a846" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function EventIcon({ type }: { type: ActivityEvent['type'] }) {
  return (
    <div
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'rgba(212,168,70,0.08)',
        border: '1px solid rgba(212,168,70,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {type === 'bid' && <BidIcon />}
      {type === 'message' && <MessageIcon />}
      {type === 'notification' && <BellIcon />}
    </div>
  )
}

export function RecentActivity() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/activity')
      .then(r => r.json())
      .then(json => {
        if (json.success) setEvents(json.data)
      })
      .catch(() => setEvents([]))
  }, [])

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <h3
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '16px',
        }}
      >
        Recent Activity
      </h3>

      {events === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '40px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '6px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {events !== null && events.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No recent activity yet.
        </p>
      )}

      {events !== null && events.length > 0 && (
        <div>
          {events.map((event, i) => (
            <Link
              key={event.id}
              href={event.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 8px',
                borderBottom:
                  i < events.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                textDecoration: 'none',
                borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLAnchorElement).style.background =
                  'rgba(255,255,255,0.02)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
              }}
            >
              <EventIcon type={event.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {event.title}
                </div>
                {event.subtitle && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {event.subtitle}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {timeAgo(new Date(event.createdAt))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
