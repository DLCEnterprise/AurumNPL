'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileNavProps {
  role?: 'BUYER' | 'SELLER' | 'SELLER_BUYER' | 'ADMIN'
}

export function MobileNav({ role }: MobileNavProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Toggle body class so CSS controls the sidebar transform — no style injection
  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen)
    return () => { document.body.classList.remove('sidebar-open') }
  }, [sidebarOpen])

  return (
    <>
      {/* Hamburger button — rendered in top nav area */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Bottom navigation — 5 tabs, role-aware */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link href="/dashboard" className={`mobile-bottom-nav__item ${pathname === '/dashboard' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Home
        </Link>

        <Link href="/listings" className={`mobile-bottom-nav__item ${pathname.startsWith('/listings') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          Listings
        </Link>

        <Link href="/messages" className={`mobile-bottom-nav__item ${pathname === '/messages' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Messages
        </Link>

        {/* Role-specific 4th tab — sellers get Pipeline, buyers get Watchlist */}
        {(role === 'SELLER' || role === 'SELLER_BUYER') ? (
          <Link href="/pipeline" className={`mobile-bottom-nav__item ${pathname === '/pipeline' ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="11" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/>
            </svg>
            Pipeline
          </Link>
        ) : (
          <Link href="/watchlist" className={`mobile-bottom-nav__item ${pathname === '/watchlist' ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            Watchlist
          </Link>
        )}

        <Link href="/profile" className={`mobile-bottom-nav__item ${pathname === '/profile' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Profile
        </Link>
      </nav>
    </>
  )
}
