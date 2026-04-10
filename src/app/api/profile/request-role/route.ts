import { NextRequest, NextResponse } from 'next/server'
// NextRequest used only in POST handler
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAdminNotification } from '@/lib/email'

const Schema = z.object({
  requestedRole: z.enum(['SELLER', 'BUYER']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 422 })
  }

  const { requestedRole } = parsed.data
  const currentRole = session.user.role

  // Can only request the other role
  if (currentRole === requestedRole || currentRole === 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Already have this role.' }, { status: 400 })
  }

  // Update pendingRoleRequest
  await prisma.user.update({
    where: { id: session.user.id },
    data: { pendingRoleRequest: requestedRole },
  })

  // Notify admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, company: true },
  })

  if (user) {
    const base = process.env.BASE_URL ?? 'http://localhost:3000'
    const adminUrl = `${base}/admin/users`

    sendAdminNotification({
      userName: `${user.name ?? 'Unknown'} [ROLE REQUEST: ${requestedRole}]`,
      userEmail: user.email,
      userCompany: user.company ?? '',
      userRole: `${currentRole} → requesting ${requestedRole}`,
      signupAt: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      approveUrl: adminUrl,
      rejectUrl: adminUrl,
    }).catch(() => { /* non-blocking */ })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  // Allow users to cancel their pending request
  const session = await auth()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pendingRoleRequest: null },
  })

  return NextResponse.json({ success: true })
}
