'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import { getInitials } from '@/lib/utils'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { SessionUser } from '@/types'

interface DropdownItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavGroup {
  label: string
  icon: React.ReactNode
  items: DropdownItem[]
  roles?: string[]
}

interface Props {
  user: SessionUser
  onPrefsOpen: () => void
}

const dropdownVariants = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring' as const, stiffness: 420, damping: 28 } },
  exit:    { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } },
}

function NavDropdown({ group, role }: { group: NavGroup; role: string }) {
  const pathname  = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  if (group.roles && !group.roles.includes(role)) return null

  const isActive = group.items.some(item =>
    item.href === '/' ? pathname === item.href : pathname.startsWith(item.href)
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`topnav__trigger${isActive ? ' active' : ''}`}
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {group.icon}
        {group.label}
        <svg className="topnav__caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="topnav__dropdown"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {group.items.map((item, i) => {
              if (item.href === '__divider__') {
                return <div key={i} className="topnav__divider" />
              }
              const active = item.href === '/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`topnav__dropdown-item${active ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TopNav({ user, onPrefsOpen }: Props) {
  const role = user.role as string

  const navGroups: NavGroup[] = [
    {
      label: 'Dashboard',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
      items: [
        {
          label: 'Overview',
          href: '/dashboard',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          ),
        },
      ],
    },
    {
      label: 'Listings',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      ),
      items: [
        {
          label: 'Browse Listings',
          href: '/listings',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          ),
        },
        ...(role === 'SELLER' || role === 'SELLER_BUYER' || role === 'ADMIN' ? [
          {
            label: 'My Listings',
            href: '/listings?mine=true',
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
              </svg>
            ),
          },
          {
            label: 'Create Listing',
            href: '/listings/new',
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            ),
          },
        ] : []),
        ...(role === 'BUYER' || role === 'SELLER_BUYER' ? [
          { label: '__divider__', href: '__divider__', icon: null },
          {
            label: 'Watchlist',
            href: '/watchlist',
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            ),
          },
        ] : []),
      ],
    },
    {
      label: 'Messages',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      ),
      items: [
        {
          label: 'Inbox',
          href: '/messages',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          ),
        },
      ],
    },
    {
      label: 'Portfolio',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="5" height="18" rx="1"/>
          <rect x="10" y="3" width="5" height="11" rx="1"/>
          <rect x="17" y="3" width="5" height="15" rx="1"/>
        </svg>
      ),
      roles: ['SELLER', 'SELLER_BUYER', 'ADMIN'],
      items: [
        {
          label: 'Pipeline',
          href: '/pipeline',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          ),
        },
        {
          label: 'My Deals',
          href: '/deals',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          ),
        },
      ],
    },
    {
      label: 'Admin',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      roles: ['ADMIN'],
      items: [
        {
          label: 'Overview',
          href: '/admin',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          ),
        },
        {
          label: 'Users',
          href: '/admin/users',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          ),
        },
        {
          label: 'Listings',
          href: '/admin/listings',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          ),
        },
        {
          label: 'Vendors',
          href: '/admin/vendors',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          ),
        },
        {
          label: 'MLPA',
          href: '/admin/mlpa',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          ),
        },
      ],
    },
  ]

  return (
    <nav className="nav scrolled" style={{ position: 'fixed', zIndex: 100 }}>
      <div className="nav__inner" style={{ gap: 0 }}>
        {/* Logo */}
        <Link href="/" className="nav__logo" style={{ flexShrink: 0 }}>
          <span className="nav__logo-icon">◈</span>
          <span className="nav__logo-text">AURUM</span>
        </Link>

        {/* Nav groups */}
        <div className="topnav__items">
          {navGroups.map(group => (
            <NavDropdown key={group.label} group={group} role={role} />
          ))}
        </div>

        {/* Right actions */}
        <div className="nav__actions" style={{ flexShrink: 0 }}>
          <ThemeToggle />
          <NotificationBell />

          {/* Preferences */}
          <button
            onClick={onPrefsOpen}
            className="btn btn--ghost btn--sm"
            title="Preferences"
            aria-label="Open preferences"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>

          {/* User chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
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

          <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn--ghost btn--sm">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
