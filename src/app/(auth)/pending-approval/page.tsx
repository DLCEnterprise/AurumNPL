import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Application Under Review' }

export default function PendingApprovalPage() {
  return (
    <div className="auth-page">
      <div className="auth-card glass-card" style={{ textAlign: 'center', maxWidth: '480px' }}>
        {/* Logo */}
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon">◈</span>
          <span className="auth-card__logo-text">AURUM</span>
        </div>

        {/* Pulsing ring animation */}
        <div style={{ margin: '0 auto 28px', width: '64px', height: '64px', position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(212,168,70,0.3)',
            animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
          }} />
          <div style={{
            position: 'absolute', inset: '8px',
            borderRadius: '50%',
            border: '2px solid rgba(212,168,70,0.5)',
          }} />
          <div style={{
            position: 'absolute', inset: '20px',
            borderRadius: '50%',
            background: 'rgba(212,168,70,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a846" strokeWidth="2">
              <path d="M12 8v4l3 3M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
          </div>
        </div>

        <style>{`
          @keyframes ping {
            75%, 100% { transform: scale(1.8); opacity: 0; }
          }
        `}</style>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '12px' }}>
          Application Under Review
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '8px' }}>
          Your account is being reviewed by our team. You&apos;ll receive a confirmation email once approved.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '36px' }}>
          This typically takes less than 24 hours.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/" className="btn btn--gold btn--full">
            Return to Homepage
          </Link>
          <a href="mailto:support@aurum.finance" className="btn btn--ghost btn--full">
            Contact Support
          </a>
        </div>

        <p style={{ marginTop: '28px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Already approved?{' '}
          <Link href="/signin" style={{ color: 'var(--gold-300)' }}>Sign in here</Link>
        </p>
      </div>
    </div>
  )
}
