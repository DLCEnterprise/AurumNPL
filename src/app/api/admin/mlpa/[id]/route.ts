import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const PatchSchema = z.object({
  version:  z.string().min(1).max(50).optional(),
  body:     z.string().min(1).optional(),
  notes:    z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
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
    return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
  }

  let template
  try {
    template = await prisma.mlpaTemplate.update({ where: { id }, data: parsed.data })
  } catch (err) {
    console.error('[PATCH /api/admin/mlpa/[id]] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: template })
}

export async function DELETE(_req: NextRequest, { params: paramsPromise }: Params) {
  const { id } = await paramsPromise
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    await prisma.mlpaTemplate.delete({ where: { id } })
  } catch (err) {
    console.error('[DELETE /api/admin/mlpa/[id]] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
