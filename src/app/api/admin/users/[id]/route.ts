import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

const PatchSchema = z.object({
  adminNotes:      z.string().max(10000).optional().nullable(),
  approvalStatus:  z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  suspendedReason: z.string().max(1000).optional().nullable(),
  name:            z.string().min(1).max(200).optional(),
  company:         z.string().max(200).optional().nullable(),
  phone:           z.string().max(50).optional().nullable(),
  role:            z.enum(['SELLER', 'BUYER', 'SELLER_BUYER', 'ADMIN']).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, company: true, phone: true,
      role: true, approvalStatus: true, createdAt: true, updatedAt: true,
      approvedAt: true, approvedBy: true,
      pendingRoleRequest: true,
      adminNotes: true, suspendedAt: true, suspendedReason: true,
      entityName: true, signerTitle: true, yearsExperience: true,
      investorType: true, lienPosition: true, loanStatusPref: true, mainObjective: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: user })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { approvalStatus, suspendedReason, ...rest } = parsed.data

  const data: Record<string, unknown> = { ...rest }
  if (approvalStatus !== undefined) {
    data.approvalStatus = approvalStatus
    if (approvalStatus === 'SUSPENDED') {
      data.suspendedAt      = new Date()
      data.suspendedReason  = suspendedReason ?? null
    } else if (approvalStatus === 'APPROVED' || approvalStatus === 'REJECTED') {
      // Clear suspension fields when un-suspending
      data.suspendedAt     = null
      data.suspendedReason = null
    }
  } else if (suspendedReason !== undefined) {
    data.suspendedReason = suspendedReason
  }

  const updated = await prisma.user.update({ where: { id }, data })
  return NextResponse.json({ success: true, data: updated })
}
