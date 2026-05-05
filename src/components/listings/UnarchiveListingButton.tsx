'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function UnarchiveListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const toast  = useToast()
  const [loading, setLoading] = useState(false)

  const unarchive = async () => {
    setLoading(true)
    const res = await fetch(`/api/listings/${listingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DRAFT' }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Listing restored to drafts.')
      router.refresh()
    } else {
      toast.error('Failed to restore listing.')
    }
  }

  return (
    <button
      className="btn btn--ghost"
      onClick={unarchive}
      disabled={loading}
      style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.2)' }}
    >
      {loading ? 'Restoring…' : 'Unarchive Listing'}
    </button>
  )
}
