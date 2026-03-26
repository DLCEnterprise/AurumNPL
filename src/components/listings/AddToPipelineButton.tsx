'use client'

import { useState } from 'react'

interface Props {
  listingId: string
}

export function AddToPipelineButton({ listingId }: Props) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  const handleClick = async () => {
    if (loading || added) return
    setLoading(true)
    try {
      const res = await fetch('/api/deal-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      if (res.ok) {
        setAdded(true)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="btn btn--ghost btn--sm"
      disabled={loading || added}
      title="Add to deal pipeline"
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      {added ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-400)" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Added
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="5" height="18" rx="1"/>
            <rect x="10" y="3" width="5" height="11" rx="1"/>
            <rect x="17" y="3" width="5" height="15" rx="1"/>
          </svg>
          {loading ? 'Adding…' : '+ Pipeline'}
        </>
      )}
    </button>
  )
}
