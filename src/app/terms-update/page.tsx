'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'

export default function TermsUpdatePage() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    if (!accepted) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: CURRENT_TERMS_VERSION }),
      })
      if (!res.ok) throw new Error('Failed to record acceptance')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '520px' }}>
      <div className="glass-card" style={{ padding: '40px' }}>
        {/* Logo / brand */}
        <div style={{
          fontFamily: 'var(--font-display, serif)',
          fontSize: '1.4rem',
          letterSpacing: '0.12em',
          color: 'var(--gold-400, #d4a846)',
          marginBottom: '28px',
          textTransform: 'uppercase',
        }}>
          AURUM
        </div>

        <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '12px' }}>
          Updated Terms of Service
        </h1>
        <p style={{ color: 'var(--text-muted, #888)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '28px' }}>
          We&apos;ve updated our Terms of Service & Confidentiality Agreement. Please review and accept the
          updated terms to continue using the AURUM platform.
        </p>

        {/* Summary */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '8px',
          background: 'rgba(212,168,70,0.04)',
          border: '1px solid rgba(212,168,70,0.15)',
          marginBottom: '24px',
          fontSize: '0.82rem',
          lineHeight: '1.7',
          color: 'var(--text-secondary, #c8c4bc)',
        }}>
          <strong style={{ color: 'var(--text-primary, #f0ede8)', display: 'block', marginBottom: '8px' }}>
            Key points of the agreement:
          </strong>
          <ul style={{ paddingLeft: '18px', margin: 0 }}>
            <li style={{ marginBottom: '5px' }}>
              <strong>Confidentiality (NDA):</strong> All deal data, counterparty identities, and pricing
              information must be kept confidential for <strong>60 months</strong> from the date of introduction.
            </li>
            <li style={{ marginBottom: '5px' }}>
              <strong>Non-Circumvention:</strong> You may not contact or transact with counterparties introduced
              through AURUM outside the platform for <strong>60 months</strong> after introduction.
            </li>
            <li style={{ marginBottom: '5px' }}>
              <strong>Platform rules:</strong> Accurate listing information, no misrepresentation, lawful use only.
            </li>
            <li>
              <strong>Governing law:</strong> Delaware, binding arbitration for disputes.
            </li>
          </ul>
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          lineHeight: '1.5',
          marginBottom: '24px',
          color: 'var(--text-secondary, #c8c4bc)',
        }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ marginTop: '2px', accentColor: 'var(--gold-400, #d4a846)', flexShrink: 0 }}
          />
          <span>
            I have read and agree to the{' '}
            <Link href="/terms" target="_blank" style={{ color: 'var(--gold-400, #d4a846)' }}>
              Terms of Service & Confidentiality Agreement
            </Link>
            , including the NDA and Non-Circumvention provisions.
          </span>
        </label>

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '16px' }}>{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={!accepted || loading}
          className="btn btn--gold"
          style={{ width: '100%', opacity: (!accepted || loading) ? 0.5 : 1 }}
        >
          {loading ? 'Saving…' : 'Accept & Continue'}
        </button>
      </div>
    </div>
  )
}
