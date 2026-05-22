import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: 'admin',
      },
    })
  } catch (err) {
    console.error('[POST /api/admin/users/[id]/approve] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Non-blocking welcome email
  sendWelcomeEmail(user.email, user.name ?? 'there').catch(() => {})

  return NextResponse.json({ success: true })
}
