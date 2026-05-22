import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const CATEGORIES = ['BPO', 'Title / O&E', 'Legal', 'Other'] as const

const PatchSchema = z.object({
  name:         z.string().min(1).max(120).optional(),
  category:     z.enum(CATEGORIES).optional(),
  description:  z.string().max(500).optional().nullable(),
  contactName:  z.string().max(100).optional().nullable(),
  contactPhone: z.string().max(30).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  website:      z.string().url().optional().nullable(),
  address:      z.string().max(200).optional().nullable(),
  isActive:     z.boolean().optional(),
  sortOrder:    z.number().int().optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function PATCH(req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  let vendor
  try {
    vendor = await prisma.vendor.update({ where: { id }, data: parsed.data })
  } catch (err) {
    console.error('[PATCH /api/admin/vendors/[id]] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: vendor })
}

export async function DELETE(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    await prisma.vendor.delete({ where: { id } })
  } catch (err) {
    console.error('[DELETE /api/admin/vendors/[id]] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
