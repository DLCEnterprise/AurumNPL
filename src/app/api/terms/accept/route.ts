import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'
import { z } from 'zod'

const bodySchema = z.object({
  version: z.string(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (parsed.data.version !== CURRENT_TERMS_VERSION) {
    return NextResponse.json({ error: 'Version mismatch' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = req.headers.get('user-agent') ?? null

  await prisma.$transaction([
    prisma.termsAcceptance.create({
      data: {
        userId: session.user.id,
        version: parsed.data.version,
        ipAddress: ip,
        userAgent,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { termsVersion: parsed.data.version },
    }),
  ])

  return NextResponse.json({ ok: true })
}
