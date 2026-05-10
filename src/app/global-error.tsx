'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '12px' }}>Something went wrong</h1>
          <p style={{ color: '#71717a', marginBottom: '24px', fontSize: '0.9rem' }}>An unexpected error occurred. Our team has been notified.</p>
          <button
            onClick={reset}
            style={{ background: 'linear-gradient(135deg, #d4a846 0%, #f0c96e 50%, #b8860b 100%)', color: '#0a0a0a', border: 'none', padding: '10px 22px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
