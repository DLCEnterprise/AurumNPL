import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { prisma } from '@/lib/prisma'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/signin')

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { approvalStatus: true, termsVersion: true },
  })
  const approvalStatus = dbUser?.approvalStatus ?? session.user.approvalStatus
  if (approvalStatus === 'PENDING')   redirect('/pending-approval')
  if (approvalStatus === 'REJECTED')  redirect('/signin?error=rejected')
  if (approvalStatus === 'SUSPENDED') redirect('/pending-approval')

  if (dbUser?.termsVersion !== CURRENT_TERMS_VERSION) redirect('/terms-update')

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  )
}
