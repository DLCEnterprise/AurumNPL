import { ListingsGridSkeleton } from '@/components/ui/Skeleton'

export default function ListingsLoading() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ width: '160px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
          <div style={{ width: '100px', height: '14px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
        </div>
      </div>
      {/* Filter bar skeleton */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '28px', display: 'flex', gap: '16px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ width: '60%', height: '11px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
            <div style={{ height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <ListingsGridSkeleton count={4} />
    </div>
  )
}
