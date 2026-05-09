import Link from 'next/link'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  padding?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  padding = '60px 40px',
}: EmptyStateProps) {
  return (
    <div
      className="glass-card"
      style={{ padding, textAlign: 'center' }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(212,168,70,0.06)',
          border: '1px solid rgba(212,168,70,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(212,168,70,0.5)',
        }}>
          {icon}
        </div>
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          fontWeight: 400,
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: actionLabel && actionHref ? '20px' : '0' }}>
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn--gold btn--sm">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
