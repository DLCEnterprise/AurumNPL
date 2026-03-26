import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.approvalStatus !== 'APPROVED') {
    return new Response('Unauthorized', { status: 401 })
  }
  const userId = session.user.id

  const encoder = new TextEncoder()
  let lastCheck = new Date()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'))

      const poll = async () => {
        if (closed) return
        try {
          // Check for new messages in user's conversations
          const newMessages = await prisma.message.findMany({
            where: {
              conversation: {
                participants: { some: { userId } }
              },
              senderId: { not: userId },
              createdAt: { gt: lastCheck },
            },
            include: {
              sender: { select: { name: true, company: true } },
              conversation: { select: { id: true } },
            },
            orderBy: { createdAt: 'asc' },
          })

          if (newMessages.length > 0) {
            lastCheck = new Date()
            for (const msg of newMessages) {
              const data = JSON.stringify({
                conversationId: msg.conversation.id,
                senderId: msg.senderId,
                senderName: msg.sender.name ?? msg.sender.company ?? 'Unknown',
                preview: msg.content.slice(0, 80),
                createdAt: msg.createdAt.toISOString(),
              })
              controller.enqueue(encoder.encode(`event: message\ndata: ${data}\n\n`))
            }
          } else {
            // Heartbeat every poll
            controller.enqueue(encoder.encode('event: heartbeat\ndata: {}\n\n'))
          }
        } catch {
          // DB error — just skip
        }

        if (!closed) setTimeout(poll, 3000)
      }

      setTimeout(poll, 3000)
    },
    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
