import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { redirect } from 'next/navigation'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { AdminUserActions } from '@/components/admin/AdminUserActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { ExportButton } from '@/components/ui/ExportButton'

export const metadata: Metadata = { title: 'Admin Overview' }

export default async function AdminOverviewPage() {
  const session = await requireAdmin()
  if (!session) redirect('/dashboard')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    pendingCount,
    approvedCount,
    rejectedCount,
    activeListingsCount,
    upbResult,
    newUsersThisWeek,
    totalConversations,
    pendingUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.user.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.user.count({ where: { approvalStatus: 'REJECTED' } }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.listing.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { unpaidBalance: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.conversation.count(),
    prisma.user.findMany({
      where: { approvalStatus: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const totalUPB = upbResult._sum.unpaidBalance ?? 0

  const stats = [
    {
      label: 'Pending Users',
      value: pendingCount,
      highlight: pendingCount > 0,
      sub: `${approvedCount} approved · ${rejectedCount} rejected`,
      href: '/admin/users?status=PENDING',
    },
    {
      label: 'Active Listings',
      value: activeListingsCount,
      highlight: false,
      sub: `Total across all sellers`,
      href: '/admin/listings',
    },
    {
      label: 'Total Active UPB',
      value: formatCurrency(totalUPB),
      highlight: false,
      sub: 'Unpaid balance on active listings',
      href: '/admin/listings',
    },
    {
      label: 'New Users (7d)',
      value: newUsersThisWeek,
      highlight: false,
      sub: `${totalConversations} total conversations`,
      href: '/admin/users',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '4px' }}>
            Admin Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Platform health at a glance
          </p>
        </div>
        <ExportButton type="analytics" label="Export Users CSV" />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="glass-card"
              style={{
                padding: '24px',
                border: stat.highlight ? '1px solid rgba(212,168,70,0.4)' : undefined,
                background: stat.highlight ? 'rgba(212,168,70,0.05)' : undefined,
                transition: 'border-color 0.2s',
              }}
            >
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {stat.label}
              </p>
              <p style={{
                fontSize: '2rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: stat.highlight ? 'var(--gold-300)' : 'var(--text-primary)',
                marginBottom: '6px',
                lineHeight: 1,
              }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending users table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 500 }}>
            Pending Approvals
            {pendingCount > 0 && (
              <span style={{
                marginLeft: '8px',
                background: 'rgba(212,168,70,0.15)',
                color: 'var(--gold-300)',
                border: '1px solid rgba(212,168,70,0.3)',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '1px 8px',
              }}>
                {pendingCount}
              </span>
            )}
          </h2>
          <Link href="/admin/users?status=PENDING" className="btn btn--ghost btn--sm" style={{ fontSize: '0.78rem' }}>
            View All
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <EmptyState
            icon={
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
            title="All caught up"
            description="No pending user approvals."
            padding="40px 24px"
          />
        ) : (
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {['Name', 'Email', 'Company', 'Role', 'Joined', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user, i) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: i < pendingUsers.length - 1 ? '1px solid var(--border-light)' : undefined,
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500 }}>
                      {user.name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {user.company ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`listing-card__type listing-card__type--${user.role === 'SELLER' ? 'residential' : 'commercial'}`}
                        style={{ fontSize: '0.7rem' }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {timeAgo(user.createdAt)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <AdminUserActions userId={user.id} currentStatus={user.approvalStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
