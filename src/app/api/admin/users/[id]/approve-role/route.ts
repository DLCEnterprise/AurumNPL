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

  const user = await prisma.user.findUnique({ where: { id }, select: { pendingRoleRequest: true } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (!user.pendingRoleRequest) {
    return NextResponse.json({ error: 'No pending role request' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id },
    data: { role: user.pendingRoleRequest as 'SELLER' | 'BUYER', pendingRoleRequest: null },
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
