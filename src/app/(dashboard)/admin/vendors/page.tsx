import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { VendorManager } from '@/components/admin/VendorManager'

export const metadata: Metadata = { title: 'Admin — Vendors' }

export default async function AdminVendorsPage() {
  const session = await requireAdmin()
  if (!session) redirect('/dashboard')

  const vendors = await prisma.vendor.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return (
    <div style={{ maxWidth: '900px' }}>
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Vendors' }]} />
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
          Vendor List
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Manage approved service providers — BPO, Title / O&E, Legal, and other vendors.
        </p>
      </div>
      <VendorManager initialVendors={vendors.map(v => ({ ...v, createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString() }))} />
    </div>
  )
}
