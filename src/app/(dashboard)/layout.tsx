import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardNav } from '@/components/layout/DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/signin')
  if (session.user.approvalStatus === 'PENDING') redirect('/pending-approval')
  if (session.user.approvalStatus === 'REJECTED') redirect('/signin?error=rejected')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <DashboardNav user={session.user} />
      <div className="dashboard-layout" style={{ paddingTop: 'var(--nav-h)' }}>
        <aside className="sidebar">
          <div className="sidebar__section">
            <p className="sidebar__label">Main</p>
            <Link href="/dashboard" className="sidebar__link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Dashboard
            </Link>
            <Link href="/listings" className="sidebar__link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Listings
            </Link>
            <Link href="/messages" className="sidebar__link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Messages
            </Link>
            <Link href="/watchlist" className="sidebar__link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              Watchlist
            </Link>
          </div>
          <div className="sidebar__section" style={{ marginTop: '16px' }}>
            <p className="sidebar__label">Account</p>
            <Link href="/profile" className="sidebar__link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              Profile
            </Link>
          </div>
          {session.user.role === 'ADMIN' && (
            <div className="sidebar__section" style={{ marginTop: '16px' }}>
              <p className="sidebar__label">Admin</p>
              <Link href="/admin" className="sidebar__link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Overview
              </Link>
              <Link href="/admin/users" className="sidebar__link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
                Users
              </Link>
              <Link href="/admin/listings" className="sidebar__link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Listings
              </Link>
            </div>
          )}
        </aside>
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  )
}
