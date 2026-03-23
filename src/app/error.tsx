'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

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
          500
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '12px' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', lineHeight: 1.7 }}>
          An unexpected error occurred. Our team has been notified.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn--gold" onClick={reset}>Try Again</button>
          <Link href="/" className="btn btn--ghost">Return Home</Link>
        </div>
      </div>
    </div>
  )
}
