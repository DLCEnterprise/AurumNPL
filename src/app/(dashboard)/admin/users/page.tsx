import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { redirect } from 'next/navigation'
import { timeAgo } from '@/lib/utils'
import { AdminUserActions } from '@/components/admin/AdminUserActions'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import type { ApprovalStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Admin — Users' }

const APPROVAL_STATUSES: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED']

const STATUS_STYLE: Record<ApprovalStatus, { bg: string; color: string; border: string; label: string }> = {
  PENDING: {
    bg: 'rgba(212,168,70,0.1)',
    color: 'var(--gold-300)',
    border: 'rgba(212,168,70,0.3)',
    label: 'Pending',
  },
  APPROVED: {
    bg: 'rgba(34,197,94,0.08)',
    color: '#4ade80',
    border: 'rgba(34,197,94,0.25)',
    label: 'Approved',
  },
  REJECTED: {
    bg: 'rgba(239,68,68,0.08)',
    color: '#f87171',
    border: 'rgba(239,68,68,0.25)',
    label: 'Rejected',
  },
}

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 20

export default async function AdminUsersPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireAdmin()
  if (!session) redirect('/dashboard')

  const searchParams = await searchParamsPromise
  const statusFilter = APPROVAL_STATUSES.includes(searchParams.status as ApprovalStatus)
    ? (searchParams.status as ApprovalStatus)
    : null
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))

  const where = statusFilter ? { approvalStatus: statusFilter } : {}

  const [users, total, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
        pendingRoleRequest: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
    Promise.all(
      APPROVAL_STATUSES.map((s) => prisma.user.count({ where: { approvalStatus: s } }))
    ),
  ])

  const statusCounts = Object.fromEntries(
    APPROVAL_STATUSES.map((s, i) => [s, counts[i]])
  ) as Record<ApprovalStatus, number>

  const totalAll = statusCounts.PENDING + statusCounts.APPROVED + statusCounts.REJECTED
  const pages = Math.ceil(total / PAGE_SIZE)

  function buildTabHref(status: string | null) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const qs = params.toString()
    return `/admin/users${qs ? `?${qs}` : ''}`
  }

  function buildPageHref(p: number) {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(p))
    return `/admin/users?${params.toString()}`
  }

  const tabs = [
    { label: 'All', status: null, count: totalAll },
    { label: 'Pending', status: 'PENDING' as ApprovalStatus, count: statusCounts.PENDING },
    { label: 'Approved', status: 'APPROVED' as ApprovalStatus, count: statusCounts.APPROVED },
    { label: 'Rejected', status: 'REJECTED' as ApprovalStatus, count: statusCounts.REJECTED },
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '4px' }}>
          User Management
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {total} user{total !== 1 ? 's' : ''}
          {statusFilter ? ` with status ${statusFilter.toLowerCase()}` : ''}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {tabs.map((tab) => {
          const active = tab.status === statusFilter
          return (
            <Link
              key={tab.label}
              href={buildTabHref(tab.status)}
              className={active ? 'btn btn--gold btn--sm' : 'btn btn--ghost btn--sm'}
              style={{ fontSize: '0.8rem' }}
            >
              {tab.label}
              <span style={{
                marginLeft: '5px',
                background: active ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '0 6px',
                fontSize: '0.7rem',
              }}>
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No users found.</p>
          <Link href="/admin/users" className="btn btn--ghost btn--sm" style={{ marginTop: '16px' }}>
            Clear Filter
          </Link>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
          <table className="table-responsive" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                {['Name', 'Email', 'Company', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
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
              {users.map((user, i) => {
                const statusStyle = STATUS_STYLE[user.approvalStatus]
                return (
                  <tr
                    key={user.id}
                    style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border-light)' : undefined }}
                  >
                    <td data-label="Name" style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500 }}>
                      {user.name ?? '—'}
                    </td>
                    <td data-label="Email" style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {user.email}
                    </td>
                    <td data-label="Company" style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {user.company ?? '—'}
                    </td>
                    <td data-label="Role" style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span
                          className={`listing-card__type listing-card__type--${user.role === 'SELLER' ? 'residential' : user.role === 'BUYER' ? 'commercial' : 'mixed'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {user.role}
                        </span>
                        {user.pendingRoleRequest && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px',
                            borderRadius: '100px', background: 'rgba(212,168,70,0.1)',
                            color: 'var(--gold-300)', border: '1px solid rgba(212,168,70,0.3)',
                            whiteSpace: 'nowrap',
                          }}>
                            + {user.pendingRoleRequest} pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Status" style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                      }}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td data-label="Joined" style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {timeAgo(user.createdAt)}
                    </td>
                    <td data-label="Actions" style={{ padding: '12px 16px' }}>
                      <AdminUserActions userId={user.id} currentStatus={user.approvalStatus} pendingRoleRequest={user.pendingRoleRequest} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
          {page > 1 && (
            <Link href={buildPageHref(page - 1)} className="btn btn--ghost btn--sm">← Prev</Link>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildPageHref(p)}
              className={p === page ? 'btn btn--gold btn--sm' : 'btn btn--ghost btn--sm'}
            >
              {p}
            </Link>
          ))}
          {page < pages && (
            <Link href={buildPageHref(page + 1)} className="btn btn--ghost btn--sm">Next →</Link>
          )}
        </div>
      )}
    </div>
  )
}
