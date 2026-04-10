'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function MarkAsSoldButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const toast  = useToast()
  const [loading,    setLoading]    = useState(false)
  const [confirming, setConfirming] = useState(false)

  const markSold = async () => {
    setLoading(true)
    const res = await fetch(`/api/listings/${listingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SOLD' }),
    })
    setLoading(false)
    setConfirming(false)
    if (res.ok) {
      toast.success('Listing marked as sold.')
      router.refresh()
    } else {
      toast.error('Failed to update listing.')
    }
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Mark as sold?</span>
        <button
          className="btn btn--sm"
          onClick={markSold}
          disabled={loading}
          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
        >
          {loading ? 'Updating…' : 'Confirm'}
        </button>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      className="btn btn--ghost"
      onClick={() => setConfirming(true)}
      style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.2)' }}
    >
      Mark as Sold
    </button>
  )
}
