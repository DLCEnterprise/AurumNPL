import type { Metadata } from 'next'
import { requireSession } from '@/lib/session-guard'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await requireSession()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, company: true, phone: true,
      role: true, approvalStatus: true, createdAt: true, pendingRoleRequest: true,
      fundType: true,
      entityName: true, signerTitle: true, yearsExperience: true,
      investorType: true, lienPosition: true, loanStatusPref: true, mainObjective: true,
      servicerName: true, servicerAddress: true,
      servicerContactName: true, servicerContactPhone: true, servicerContactEmail: true,
    },
  })

  if (!user) return null

  return (
    <div style={{ maxWidth: '600px' }}>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]} />
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
          Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage your account information and credentials.
        </p>
      </div>
      <ProfileForm
        user={{
          ...user,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </div>
  )
}
