import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { sendRejectionEmail } from '@/lib/email'

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

  await prisma.user.update({
    where: { id },
    data: {
      approvalStatus: 'REJECTED',
    },
  })

  // Non-blocking rejection email
  sendRejectionEmail(user.email, user.name ?? 'there').catch(() => {})

  return NextResponse.json({ success: true })
}
