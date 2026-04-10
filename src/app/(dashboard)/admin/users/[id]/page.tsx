import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { timeAgo } from '@/lib/utils'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { AdminUserEditor } from '@/components/admin/AdminUserEditor'

export const metadata: Metadata = { title: 'Admin — Edit User' }

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAdmin()
  if (!session) redirect('/dashboard')

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, company: true, phone: true,
      role: true, approvalStatus: true, createdAt: true, updatedAt: true,
      approvedAt: true, approvedBy: true,
      pendingRoleRequest: true,
      adminNotes: true, suspendedAt: true, suspendedReason: true,
      entityName: true, signerTitle: true, yearsExperience: true,
      investorType: true, lienPosition: true, loanStatusPref: true, mainObjective: true,
      _count: { select: { listings: true, bidsPlaced: true, savedListings: true } },
    },
  })

  if (!user) notFound()

  const serialized = {
    ...user,
    createdAt:   user.createdAt.toISOString(),
    updatedAt:   user.updatedAt.toISOString(),
    approvedAt:  user.approvedAt?.toISOString() ?? null,
    suspendedAt: user.suspendedAt?.toISOString() ?? null,
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: user.name ?? user.email },
        ]}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '4px' }}>
            {user.name ?? user.email}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {user.email} · Joined {timeAgo(user.createdAt)}
          </p>
        </div>
        {/* Activity summary */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: 'Listings', value: user._count.listings },
            { label: 'Bids', value: user._count.bidsPlaced },
            { label: 'Saved', value: user._count.savedListings },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {value}
              </div>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminUserEditor user={serialized} />
    </div>
  )
}
