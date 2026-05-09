/** Spinning loader for button loading states */
export function Spinner({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

/** Pulse-animated skeleton blocks for loading states */

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  style,
}: SkeletonProps) {
  return (
    <div
      style={{
        width, height,
        borderRadius,
        background: 'rgba(255,255,255,0.06)',
        animation: 'skeletonPulse 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

/** Skeleton shaped like a listing card */
export function ListingCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading listing"
      className="glass-card"
      style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width="80px" height="22px" borderRadius="100px" />
        <Skeleton width="60px" height="22px" borderRadius="100px" />
      </div>
      <Skeleton width="75%" height="22px" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="50%" height="11px" />
            <Skeleton width="70%" height="16px" />
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '12px', borderTop: '1px solid var(--border)',
        }}
      >
        <Skeleton width="90px" height="13px" />
        <Skeleton width="90px" height="32px" borderRadius="6px" />
      </div>
    </div>
  )
}

/** Grid of listing card skeletons */
export function ListingsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="listings__grid">
      {[...Array(count)].map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for the dashboard stats row */
export function DashboardStatsSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard statistics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="stat-card glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton width="60%" height="11px" />
          <Skeleton width="50%" height="36px" />
          <Skeleton width="40%" height="11px" />
        </div>
      ))}
    </div>
  )
}

/** Skeleton for conversation list item */
export function ConversationSkeleton() {
  return (
    <div role="status" aria-label="Loading conversation" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
      <Skeleton width="38px" height="38px" borderRadius="50%" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Skeleton width="60%" height="14px" />
        <Skeleton width="80%" height="12px" />
      </div>
      <Skeleton width="24px" height="12px" />
    </div>
  )
}
