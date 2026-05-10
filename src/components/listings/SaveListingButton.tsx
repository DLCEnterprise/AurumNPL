'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

interface Props {
  listingId: string
  initialSaved: boolean
}

export function SaveListingButton({ listingId, initialSaved }: Props) {
  const toast = useToast()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    const wasSaved = saved
    setSaved(!wasSaved)
    try {
      const res = await fetch(`/api/listings/${listingId}/save`, {
        method: wasSaved ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error()
      toast.success(wasSaved ? 'Removed from watchlist.' : 'Saved to watchlist.')
    } catch {
      setSaved(wasSaved)
      toast.error('Could not update watchlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      className="btn btn--ghost"
      disabled={loading}
      title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={saved ? 'var(--gold-400)' : 'none'}
        stroke={saved ? 'var(--gold-400)' : 'currentColor'}
        strokeWidth="2"
        style={{ flexShrink: 0 }}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
