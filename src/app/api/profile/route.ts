import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hash, compare } from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const UpdateProfileSchema = z.object({
  name:    z.string().min(2).optional(),
  company: z.string().min(2).optional(),
  phone:   z.string().optional(),
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type } = body

  if (type === 'password') {
    const parsed = ChangePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.passwordHash) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 })
    }

    const valid = await compare(parsed.data.currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect.' },
        { status: 422 }
      )
    }

    const newHash = await hash(parsed.data.newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ success: true })
  }

  // Profile info update
  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { id: true, name: true, company: true, phone: true, email: true, role: true, approvalStatus: true },
  })

  return NextResponse.json({ success: true, data: updated })
}
