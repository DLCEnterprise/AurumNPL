import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { MlpaEditor } from '@/components/admin/MlpaEditor'
import { DEFAULT_MLPA_BODY, AVAILABLE_TOKENS } from '@/lib/mlpa-default'

export const metadata: Metadata = { title: 'Admin — MLPA Template' }

export default async function AdminMlpaPage() {
  const session = await requireAdmin()
  if (!session) redirect('/dashboard')

  const templates = await prisma.mlpaTemplate.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div style={{ maxWidth: '960px' }}>
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'MLPA Template' }]} />
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
          MLPA Template
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Manage the Mortgage Loan Purchase Agreement template. Use <code style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>{'{{TOKEN}}'}</code> placeholders — they are replaced automatically when generating an MLPA for a deal.
        </p>
      </div>
      <MlpaEditor
        initialTemplates={templates.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() }))}
        defaultBody={DEFAULT_MLPA_BODY}
        availableTokens={AVAILABLE_TOKENS}
      />
    </div>
  )
}
