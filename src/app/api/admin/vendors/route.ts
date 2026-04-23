import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CATEGORIES = ['BPO', 'Title / O&E', 'Legal', 'Other'] as const

const VendorSchema = z.object({
  name:         z.string().min(1).max(120),
  category:     z.enum(CATEGORIES),
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

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const vendors = await prisma.vendor.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
  return NextResponse.json({ success: true, data: vendors })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = VendorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const vendor = await prisma.vendor.create({ data: parsed.data })
  return NextResponse.json({ success: true, data: vendor }, { status: 201 })
}
