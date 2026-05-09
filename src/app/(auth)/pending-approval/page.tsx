import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Account Status' }

export default async function PendingApprovalPage() {
  // Read current status and suspension reason directly from DB so the page
  // always reflects reality, even if the JWT is stale.
  const session = await auth()
  let isSuspended = false
  let suspendedReason: string | null = null

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { approvalStatus: true, suspendedReason: true },
    })
    isSuspended = dbUser?.approvalStatus === 'SUSPENDED'
    suspendedReason = dbUser?.suspendedReason ?? null
  }

  if (isSuspended) {
    return (
      <div className="auth-page">
        <div className="auth-card glass-card" style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div className="auth-card__logo">
            <span className="auth-card__logo-icon">◈</span>
            <span className="auth-card__logo-text">AURUM</span>
          </div>

          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 28px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '12px' }}>
            Account Suspended
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '8px' }}>
            Your account has been suspended and access to AURUM has been temporarily removed.
          </p>

          {suspendedReason && (
            <div style={{
              margin: '20px 0', padding: '14px 18px', textAlign: 'left',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
            }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Reason
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {suspendedReason}
              </p>
            </div>
          )}

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '32px' }}>
            If you believe this is an error, please contact our support team.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a href="mailto:support@aurum.finance" className="btn btn--gold btn--full">
              Contact Support
            </a>
            <Link href="/" className="btn btn--ghost btn--full">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card" style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon">◈</span>
          <span className="auth-card__logo-text">AURUM</span>
        </div>

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
