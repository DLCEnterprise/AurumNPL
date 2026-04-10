'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function UnarchiveListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const unarchive = async () => {
    setLoading(true)
    await fetch(`/api/listings/${listingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DRAFT' }),
    })
    router.refresh()
    setLoading(false)
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
