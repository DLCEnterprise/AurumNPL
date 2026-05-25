import type { Metadata } from 'next'
import { requireSession } from '@/lib/session-guard'
import { MessagingApp } from '@/components/messaging/MessagingApp'

export const metadata: Metadata = { title: 'Messages' }

export default async function MessagesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ convo?: string }>
}) {
  const searchParams = await searchParamsPromise
  const session = await requireSession()
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400 }}>
          Messages
        </h1>
      </div>
      <MessagingApp userId={session.user.id} initialConvoId={searchParams.convo} />
    </div>
  )
}
