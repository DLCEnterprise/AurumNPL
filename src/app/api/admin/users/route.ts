import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import type { ApprovalStatus, UserRole } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') as ApprovalStatus | null
  const role = searchParams.get('role') as UserRole | null
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))

  const where = {
    ...(status ? { approvalStatus: status } : {}),
    ...(role ? { role } : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        role: true,
        approvalStatus: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
