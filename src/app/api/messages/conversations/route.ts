import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── GET /api/messages/conversations ─────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, company: true } } },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  })

  // Fetch all unread counts in a single grouped query instead of N queries
  const conversationIds = participations.map((p) => p.conversation.id)
  const unreadGroups = await prisma.message.groupBy({
    by: ['conversationId'],
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { id: true },
  })
  const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count.id]))

  const conversations = participations.map((p) => {
    const convo = p.conversation
    const otherParticipant = convo.participants.find((cp) => cp.userId !== userId)?.user ?? null
    const lastMessage = convo.messages[0] ?? null

    return {
      id: convo.id,
      listingId: convo.listingId,
      createdAt: convo.createdAt.toISOString(),
      updatedAt: convo.updatedAt.toISOString(),
      otherParticipant,
      lastMessage: lastMessage
        ? {
            ...lastMessage,
            createdAt: lastMessage.createdAt.toISOString(),
            readAt: lastMessage.readAt?.toISOString() ?? null,
          }
        : null,
      unreadCount: unreadMap.get(convo.id) ?? 0,
    }
  })

  return NextResponse.json({ success: true, data: conversations })
}

// ─── POST /api/messages/conversations ────────────────────────────────────────

const NewConvoSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required.'),
  listingId:   z.string().optional(),
  message:     z.string().min(1, 'Initial message is required.'),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = NewConvoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed.' }, { status: 422 })
  }

  const { recipientId, listingId, message } = parsed.data
  const senderId = session.user.id

  if (senderId === recipientId) {
    return NextResponse.json({ success: false, error: 'Cannot message yourself.' }, { status: 400 })
  }

  // Check if a conversation between these two users already exists for this listing.
  // Using two `some` conditions correctly requires both participants to be present,
  // then the length check below ensures no extra participants exist.
  const existing = await prisma.conversation.findFirst({
    where: {
      listingId: listingId ?? null,
      AND: [
        { participants: { some: { userId: senderId } } },
        { participants: { some: { userId: recipientId } } },
      ],
    },
    include: { participants: { select: { userId: true } } },
  })

  if (existing && existing.participants.length === 2) {
    // Add new message to existing conversation
    const msg = await prisma.message.create({
      data: { content: message, senderId, receiverId: recipientId, conversationId: existing.id },
    })
    await prisma.conversation.update({ where: { id: existing.id }, data: { updatedAt: new Date() } })
    return NextResponse.json({
      success: true,
      data: { conversationId: existing.id, messageId: msg.id },
    })
  }

  // Create new conversation
  const convo = await prisma.conversation.create({
    data: {
      listingId: listingId ?? null,
      participants: {
        create: [{ userId: senderId }, { userId: recipientId }],
      },
      messages: {
        create: [{ content: message, senderId, receiverId: recipientId }],
      },
    },
  })

  return NextResponse.json(
    { success: true, data: { conversationId: convo.id } },
    { status: 201 }
  )
}
