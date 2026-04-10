import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id }, select: { pendingRoleRequest: true, role: true } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (!user.pendingRoleRequest) {
    return NextResponse.json({ error: 'No pending role request' }, { status: 400 })
  }

  // If user already has the complementary role, grant SELLER_BUYER instead of overwriting
  const requested = user.pendingRoleRequest as 'SELLER' | 'BUYER'
  const newRole: 'SELLER' | 'BUYER' | 'SELLER_BUYER' =
    (user.role === 'SELLER' && requested === 'BUYER') ||
    (user.role === 'BUYER'  && requested === 'SELLER')
      ? 'SELLER_BUYER'
      : requested

  await prisma.user.update({
    where: { id },
    data: { role: newRole, pendingRoleRequest: null },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  await prisma.user.update({
    where: { id },
    data: { pendingRoleRequest: null },
  })

  return NextResponse.json({ success: true })
}
