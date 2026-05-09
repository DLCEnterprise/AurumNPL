import type { Metadata } from 'next'
import { Suspense, lazy } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ActionItems } from '@/components/dashboard/ActionItems'
import { StatCounter } from '@/components/ui/StatCounter'

const DashboardCharts = lazy(() =>
  import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts }))
)
const RecentActivity = lazy(() =>
  import('@/components/dashboard/RecentActivity').then(m => ({ default: m.RecentActivity }))
)

export const metadata: Metadata = { title: 'Dashboard' }

function ChartsSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      {[0, 1].map(i => (
        <div
          key={i}
          className="glass-card"
          style={{ padding: '20px', height: '260px' }}
        >
          <div
            style={{
              height: '12px',
              width: '160px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '4px',
              marginBottom: '16px',
            }}
          />
          <div
            style={{
              height: '200px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '8px',
            }}
          />
        </div>
      ))}
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div
        style={{
          height: '12px',
          width: '120px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '4px',
          marginBottom: '16px',
        }}
      />
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            height: '40px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '6px',
            marginBottom: '8px',
          }}
        />
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id
  const role = session!.user.role

  const isSeller = role === 'SELLER' || role === 'SELLER_BUYER'
  const isBuyer  = role === 'BUYER'  || role === 'SELLER_BUYER'

  // Role-aware stats queries
  const [stat1, stat2, convCount, unread] = await Promise.all([
    isSeller
      ? prisma.listing.count({ where: { sellerId: userId } })
      : isBuyer
      ? prisma.bid.count({ where: { bidderId: userId, status: { in: ['PENDING', 'COUNTERED'] } } })
      : prisma.user.count(),
    isSeller
      ? prisma.listing.count({ where: { sellerId: userId, status: 'ACTIVE' } })
      : isBuyer
      ? prisma.savedListing.count({ where: { userId } })
      : prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.conversationParticipant.count({ where: { userId } }),
    prisma.message.count({
      where: {
        conversation: { participants: { some: { userId } } },
        senderId: { not: userId },
        readAt: null,
      },
    }),
  ])

  const name = session!.user.name?.split(' ')[0] ?? 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const roleLabel =
    role === 'SELLER'       ? 'Seller Account'      :
    role === 'BUYER'        ? 'Buyer Account'        :
    role === 'SELLER_BUYER' ? 'Buyer + Seller'       :
    role === 'ADMIN'        ? 'Administrator'        : 'Account'

  const stats =
    isSeller ? [
      { label: 'Total Listings',   value: stat1, sub: 'all time' },
      { label: 'Active Listings',  value: stat2, sub: 'currently live' },
      { label: 'Conversations',    value: convCount, sub: 'total inquiries' },
      { label: 'Unread Messages',  value: unread, sub: 'awaiting reply' },
    ] : isBuyer ? [
      { label: 'Active Bids',      value: stat1, sub: 'pending / countered' },
      { label: 'Watchlist',        value: stat2, sub: 'saved listings' },
      { label: 'Conversations',    value: convCount, sub: 'total threads' },
      { label: 'Unread Messages',  value: unread, sub: 'awaiting reply' },
    ] : [
      { label: 'Total Users',      value: stat1, sub: 'registered' },
      { label: 'Active Listings',  value: stat2, sub: 'platform-wide' },
      { label: 'Conversations',    value: convCount, sub: 'your threads' },
      { label: 'Unread Messages',  value: unread, sub: 'awaiting reply' },
    ]

  const quickActions =
    role === 'ADMIN'        ? QUICK_ACTIONS_ADMIN  :
    role === 'BUYER'        ? QUICK_ACTIONS_BUYER  :
    QUICK_ACTIONS_SELLER   // SELLER and SELLER_BUYER get seller actions

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, margin: 0 }}>
            {greeting}, <span className="text-gold">{name}</span>
          </h1>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '4px 12px', borderRadius: '100px',
            background: role === 'ADMIN'
              ? 'rgba(239,68,68,0.1)'
              : 'rgba(212,168,70,0.1)',
            color: role === 'ADMIN' ? '#f87171' : 'var(--gold-300)',
            border: `1px solid ${role === 'ADMIN' ? 'rgba(239,68,68,0.2)' : 'rgba(212,168,70,0.2)'}`,
            alignSelf: 'center',
          }}>
            {roleLabel}
          </span>
        </div>
        {session!.user.company && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{session!.user.company}</p>
        )}
      </div>

      {/* Action Items (server component — no Suspense needed for zero state) */}
      <ActionItems />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card glass-card">
            <div className="stat-card__label">{stat.label}</div>
            <div className="stat-card__value"><StatCounter value={stat.value} /></div>
            <div className="stat-card__sub">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Dashboard Charts */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts />
      </Suspense>

      {/* Quick actions */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, marginBottom: '16px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="glass-card" style={{
              padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '10px',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              <div style={{
                width: '40px', height: '40px',
                background: 'rgba(212,168,70,0.08)',
                border: '1px solid rgba(212,168,70,0.15)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--gold-400)',
              }}>
                {action.icon}
              </div>
              <div>
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{action.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </>
  )
}

const ICON_PLUS = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
const ICON_MSG  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
const ICON_USER = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
const ICON_LIST = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
const ICON_SHLD = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>

const QUICK_ACTIONS_SELLER = [
  { href: '/listings/new', title: 'Create New Listing', desc: 'List a new NPL portfolio',       icon: ICON_PLUS },
  { href: '/messages',     title: 'View Messages',      desc: 'Manage buyer conversations',     icon: ICON_MSG  },
  { href: '/profile',      title: 'Edit Profile',       desc: 'Update account information',     icon: ICON_USER },
]

const QUICK_ACTIONS_BUYER = [
  { href: '/listings',  title: 'Browse Listings', desc: 'Find NPL portfolios to bid on',  icon: ICON_LIST },
  { href: '/messages',  title: 'View Messages',   desc: 'Manage seller conversations',    icon: ICON_MSG  },
  { href: '/profile',   title: 'Edit Profile',    desc: 'Update account information',     icon: ICON_USER },
]

const QUICK_ACTIONS_ADMIN = [
  { href: '/admin/users',    title: 'Manage Users',    desc: 'Review and approve accounts', icon: ICON_USER },
  { href: '/admin/listings', title: 'Manage Listings', desc: 'Oversee platform listings',   icon: ICON_LIST },
  { href: '/admin',          title: 'Admin Overview',  desc: 'Platform stats and controls', icon: ICON_SHLD },
]
