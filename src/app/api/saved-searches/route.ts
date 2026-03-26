import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── GET /api/saved-searches ──────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const savedSearches = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: savedSearches })
}

// ─── POST /api/saved-searches ─────────────────────────────────────────────────

const CreateSchema = z.object({
  name:         z.string().min(1, 'Name is required.').max(100),
  filters:      z.record(z.unknown()),
  alertEnabled: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
    }
    return NextResponse.json({ success: false, error: 'Validation failed.', fieldErrors }, { status: 422 })
  }

  const savedSearch = await prisma.savedSearch.create({
    data: {
      userId:       session.user.id,
      name:         parsed.data.name,
      filters:      parsed.data.filters as Record<string, string>,
      alertEnabled: parsed.data.alertEnabled ?? true,
    },
  })

  return NextResponse.json({ success: true, data: savedSearch }, { status: 201 })
}

// ─── DELETE /api/saved-searches?id= ──────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id parameter.' }, { status: 400 })
  }

  const savedSearch = await prisma.savedSearch.findUnique({ where: { id } })
  if (!savedSearch || savedSearch.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Not found.' }, { status: 404 })
  }

  await prisma.savedSearch.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
