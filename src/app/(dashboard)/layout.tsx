import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardNav } from '@/components/layout/DashboardNav'
import { SidebarLinks } from '@/components/layout/SidebarLinks'
import { SellerTour } from '@/components/ui/SellerTour'
import { BuyerTour } from '@/components/ui/BuyerTour'
import { PageTransition } from '@/components/ui/PageTransition'
import { prisma } from '@/lib/prisma'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/signin')

  // Re-check approval status and terms version from DB on every request so
  // suspension/rejection takes effect immediately, regardless of what is baked into the JWT.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { approvalStatus: true, termsVersion: true },
  })
  const approvalStatus = dbUser?.approvalStatus ?? session.user.approvalStatus
  if (approvalStatus === 'PENDING') redirect('/pending-approval')
  if (approvalStatus === 'REJECTED') redirect('/signin?error=rejected')
  if (approvalStatus === 'SUSPENDED') redirect('/signin?error=suspended')

  if (dbUser?.termsVersion !== CURRENT_TERMS_VERSION) redirect('/terms-update')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <DashboardNav user={session.user} />
      <div className="dashboard-layout">
        <aside className="sidebar">
          <SidebarLinks role={session.user.role} />
        </aside>
        <main className="dashboard-main" id="main-content">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      {session.user.role === 'SELLER' && <SellerTour />}
      {session.user.role === 'BUYER' && <BuyerTour />}
    </div>
  )
}
