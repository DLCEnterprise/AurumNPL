'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function ArchiveListingButton({ listingId }: { listingId: string }) {
  const router  = useRouter()
  const toast   = useToast()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const archive = async () => {
    setLoading(true)
    const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      router.push('/listings?mine=true')
    } else {
      toast.error('Failed to archive listing.')
      setConfirm(false)
    }
  }

  if (!confirm) {
    return (
      <button
        className="btn btn--ghost"
        onClick={() => setConfirm(true)}
        style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
      >
        Archive Listing
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Are you sure?</span>
      <button
        className="btn btn--sm"
        disabled={loading}
        onClick={archive}
        style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
      >
        {loading ? 'Archiving…' : 'Yes, Archive'}
      </button>
      <button className="btn btn--ghost btn--sm" onClick={() => setConfirm(false)}>Cancel</button>
    </div>
  )
}
