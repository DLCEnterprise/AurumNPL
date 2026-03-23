import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="auth-page">
      <div style={{ textAlign: 'center', maxWidth: '440px' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '6rem', fontWeight: 300,
          background: 'var(--gold-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1, marginBottom: '16px',
        }}>
          404
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '12px' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', lineHeight: 1.7 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/" className="btn btn--gold">Return Home</Link>
          <Link href="/dashboard" className="btn btn--ghost">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
