'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PublishListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const publish = async () => {
    setLoading(true)
    await fetch(`/api/listings/${listingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    })
    router.refresh()
  }

  return (
    <button className="btn btn--gold" onClick={publish} disabled={loading}>
      {loading ? 'Publishing…' : 'Publish Listing'}
    </button>
  )
}
