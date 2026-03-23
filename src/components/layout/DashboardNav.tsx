'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { getInitials } from '@/lib/utils'
import type { SessionUser } from '@/types'

interface DashboardNavProps {
  user: SessionUser
}

export function DashboardNav({ user }: DashboardNavProps) {
  return (
    <nav className="nav scrolled" style={{ position: 'fixed' }}>
      <div className="nav__inner">
        <Link href="/" className="nav__logo">
          <span className="nav__logo-icon">◈</span>
          <span className="nav__logo-text">AURUM</span>
        </Link>

        <div className="nav__actions">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              background: 'rgba(212,168,70,0.15)',
              border: '1px solid rgba(212,168,70,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold-300)',
            }}>
              {getInitials(user.name ?? user.email)}
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{user.name ?? user.email}</div>
              {user.company && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.company}</div>
              )}
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn btn--ghost btn--sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
