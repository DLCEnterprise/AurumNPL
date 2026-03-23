import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: { conversationId: string } }

async function assertParticipant(userId: string, conversationId: string) {
  const p = await prisma.conversationParticipant.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  })
  return !!p
}

// ─── GET /api/messages/[conversationId] ──────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { conversationId } = params

  const isMember = await assertParticipant(userId, conversationId)
  if (!isMember) {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  // Mark messages from others as read
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  })

  // Update lastReadAt for this participant
  await prisma.conversationParticipant.update({
    where: { userId_conversationId: { userId, conversationId } },
    data: { lastReadAt: new Date() },
  })

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true, company: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const serialized = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
  }))

  return NextResponse.json({ success: true, data: serialized })
}

// ─── POST /api/messages/[conversationId] ─────────────────────────────────────

const SendSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty.').max(4000),
})

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { conversationId } = params

  const isMember = await assertParticipant(userId, conversationId)
  if (!isMember) {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = SendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
  }

  // Find recipient (other participant)
  const otherParticipant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: { not: userId } },
  })

  const message = await prisma.message.create({
    data: {
      content: parsed.data.content,
      senderId: userId,
      receiverId: otherParticipant?.userId ?? null,
      conversationId,
    },
    include: { sender: { select: { id: true, name: true, company: true } } },
  })

  // Update conversation timestamp for sorting
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    data: {
      ...message,
      createdAt: message.createdAt.toISOString(),
      readAt: null,
    },
  }, { status: 201 })
}
