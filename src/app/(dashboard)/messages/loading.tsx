import { ConversationSkeleton } from '@/components/ui/Skeleton'

export default function MessagesLoading() {
  return (
    <div>
      <div style={{ marginBottom: '24px', width: '120px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
      <div className="messaging__app glass-card" style={{ height: '600px' }}>
        <div className="messaging__sidebar">
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '100px', height: '16px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
          </div>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
          </div>
          {[...Array(4)].map((_, i) => <ConversationSkeleton key={i} />)}
        </div>
        <div className="messaging__chat" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', opacity: 0.4 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
