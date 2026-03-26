import type { Metadata } from 'next'
import { Suspense, lazy } from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ActionItems } from '@/components/dashboard/ActionItems'

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

  const [listingCount, activeCount, convCount] = await Promise.all([
    prisma.listing.count({ where: { sellerId: userId } }),
    prisma.listing.count({ where: { sellerId: userId, status: 'ACTIVE' } }),
    prisma.conversationParticipant.count({ where: { userId } }),
  ])

  // Unread messages count
  const unread = await prisma.message.count({
    where: {
      conversation: { participants: { some: { userId } } },
      senderId: { not: userId },
      readAt: null,
    },
  })

  const name = session!.user.name?.split(' ')[0] ?? 'there'

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
          Good morning, <span className="text-gold">{name}</span>
        </h1>
        {session!.user.company && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{session!.user.company}</p>
        )}
      </div>

      {/* Action Items (server component — no Suspense needed for zero state) */}
      <ActionItems />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {[
          { label: 'Total Listings', value: listingCount, sub: 'all time' },
          { label: 'Active Listings', value: activeCount, sub: 'currently live' },
          { label: 'Conversations', value: convCount, sub: 'total inquiries' },
          { label: 'Unread Messages', value: unread, sub: 'awaiting reply' },
        ].map((stat) => (
          <div key={stat.label} className="stat-card glass-card">
            <div className="stat-card__label">{stat.label}</div>
            <div className="stat-card__value">{stat.value}</div>
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
          {QUICK_ACTIONS.map((action) => (
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

      {/* Role badge */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Account Type
          </div>
          <div style={{ fontWeight: 500 }}>
            {session!.user.role === 'SELLER' ? 'Seller Account' : 'Buyer Account'}
          </div>
        </div>
        <span style={{
          fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.06em', padding: '4px 12px', borderRadius: '100px',
          background: 'rgba(52,211,153,0.1)', color: 'var(--success)',
        }}>
          Approved
        </span>
      </div>

      {/* Recent Activity */}
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </>
  )
}

const QUICK_ACTIONS = [
  {
    href: '/listings/new',
    title: 'Create New Listing',
    desc: 'List a new NPL portfolio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: '/messages',
    title: 'View Messages',
    desc: 'Manage buyer conversations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    title: 'Edit Profile',
    desc: 'Update account information',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
  },
]
