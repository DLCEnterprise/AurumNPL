import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function ActionItems() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const [pendingBids, unreadMessages, expiringBids] = await Promise.all([
    // Pending bids on user's listings (sellers)
    session.user.role !== 'BUYER'
      ? prisma.bid.count({ where: { listing: { sellerId: userId }, status: 'PENDING' } })
      : Promise.resolve(0),
    // Unread messages
    prisma.conversationParticipant.count({ where: { userId, lastReadAt: null } }),
    // Expiring bids (within 48 hours, for buyers)
    session.user.role === 'BUYER'
      ? prisma.bid.count({
          where: {
            bidderId: userId,
            status: 'PENDING',
            expiresAt: {
              lte: new Date(Date.now() + 48 * 60 * 60 * 1000),
              gt: new Date(),
            },
          },
        })
      : Promise.resolve(0),
  ])

  const items = [
    pendingBids > 0
      ? {
          label: `${pendingBids} pending bid${pendingBids !== 1 ? 's' : ''} awaiting review`,
          href: '/listings?mine=true',
          color: '#d4a846',
        }
      : null,
    unreadMessages > 0
      ? {
          label: `${unreadMessages} unread message${unreadMessages !== 1 ? 's' : ''}`,
          href: '/messages',
          color: '#60a5fa',
        }
      : null,
    expiringBids > 0
      ? {
          label: `${expiringBids} bid${expiringBids !== 1 ? 's' : ''} expiring within 48 hours`,
          href: '/listings',
          color: '#fb923c',
        }
      : null,
  ].filter(Boolean) as { label: string; href: string; color: string }[]

  if (items.length === 0) return null

  return (
    <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
      <h3
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '12px',
        }}
      >
        Action Items
      </h3>
      {items.map((item, i) => (
        <a
          key={i}
          href={item.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 0',
            borderBottom:
              i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {item.label}
          </span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            →
          </span>
        </a>
      ))}
    </div>
  )
}
