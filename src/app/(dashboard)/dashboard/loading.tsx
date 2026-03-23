import { DashboardStatsSkeleton } from '@/components/ui/Skeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div>
      <div style={{ marginBottom: '36px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width="260px" height="36px" />
        <Skeleton width="140px" height="14px" />
      </div>
      <DashboardStatsSkeleton />
      <div style={{ marginBottom: '16px' }}>
        <Skeleton width="120px" height="22px" style={{ marginBottom: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton width="40px" height="40px" borderRadius="8px" />
              <div>
                <Skeleton width="70%" height="16px" style={{ marginBottom: '6px' }} />
                <Skeleton width="85%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
