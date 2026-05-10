'use client'

import { useState, useEffect } from 'react'

interface NdaGateProps {
  listingId: string
  dropboxLink: string
}

export function NdaGate({ listingId, dropboxLink }: NdaGateProps) {
  const [signed, setSigned] = useState<boolean | null>(null)
  const [signedAt, setSignedAt] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    fetch(`/api/listings/${listingId}/nda`)
      .then(r => r.json())
      .then(d => {
        setSigned(d.signed)
        setSignedAt(d.signedAt ?? null)
      })
      .catch(() => setSigned(false))
  }, [listingId])

  async function handleSign() {
    if (!agreed) return
    setSigning(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/nda`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSigned(true)
        setSignedAt(data.signedAt)
      }
    } finally {
      setSigning(false)
    }
  }

  if (signed === null) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Checking document access...
      </div>
    )
  }

  if (signed) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontWeight: 500, color: 'var(--success)', fontSize: '0.85rem' }}>
            NDA signed — document access granted
          </span>
          {signedAt && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {new Date(signedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <a
          href={dropboxLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--gold btn--sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Access Collateral Documents
        </a>
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
        Collateral Documents
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
        Sign the NDA below to unlock immediate access to the full collateral package for this listing.
      </p>

      {/* 3-step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '24px' }}>
        {[
          { n: '1', label: 'Review NDA' },
          { n: '2', label: 'Acknowledge' },
          { n: '3', label: 'Access Documents' },
        ].map((step, i) => (
          <div key={step.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700,
                background: 'rgba(212,168,70,0.12)', border: '1px solid rgba(212,168,70,0.3)', color: 'var(--gold-400)',
              }}>{step.n}</div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{step.label}</span>
            </div>
            {i < 2 && <div style={{ height: '1px', flex: 1, background: 'rgba(212,168,70,0.2)', margin: '0 4px 18px' }} />}
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          marginBottom: '20px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          maxHeight: '160px',
          overflowY: 'auto',
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>Non-Disclosure Agreement</strong><br /><br />
        The undersigned party agrees to maintain strict confidentiality with respect to all non-public information,
        documents, and materials (collectively, &quot;Confidential Information&quot;) provided in connection with the above-referenced
        loan portfolio. Confidential Information shall not be disclosed to any third party without prior written consent.
        This agreement shall remain in force for a period of two (2) years from the date of execution. The receiving party
        acknowledges that any breach may cause irreparable harm for which monetary damages would be insufficient, and agrees
        that equitable relief may be sought in addition to any other remedies available at law.
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          style={{ marginTop: '2px', accentColor: 'var(--gold-400)' }}
          aria-label="I agree to the Non-Disclosure Agreement"
        />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          I have read and agree to the Non-Disclosure Agreement above. I understand this is a legally binding commitment.
        </span>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSign}
          disabled={!agreed || signing}
          className="btn btn--gold btn--sm"
          style={{ opacity: !agreed || signing ? 0.5 : 1 }}
        >
          {signing ? 'Signing...' : 'Sign NDA & Access Documents'}
        </button>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Access is granted immediately after signing.
        </span>
      </div>
    </div>
  )
}
