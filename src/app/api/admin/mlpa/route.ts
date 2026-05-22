import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const TemplateSchema = z.object({
  version: z.string().min(1).max(50),
  body:    z.string().min(1),
  notes:   z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const templates = await prisma.mlpaTemplate.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ success: true, data: templates })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = TemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  let template
  try {
    template = await prisma.mlpaTemplate.create({ data: parsed.data })
  } catch (err) {
    console.error('[POST /api/admin/mlpa] db error:', err)
    const message = err instanceof Error ? err.message : 'Database error.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: template }, { status: 201 })
}
