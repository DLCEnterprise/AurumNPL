'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

interface Props {
  listingId: string
  bidId: string
  currentStatus: string
}

export function BidActions({ listingId, bidId, currentStatus }: Props) {
  const router = useRouter()
  const toast  = useToast()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  if (currentStatus !== 'PENDING') {
    return null
  }

  const update = async (action: 'accept' | 'reject') => {
    setLoading(action)
    const status = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
    const res = await fetch(`/api/listings/${listingId}/bids/${bidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(null)

    const data = await res.json()
    if (!res.ok || !data.success) {
      toast.error(data.error ?? 'Action failed.')
      return
    }

    toast.success(action === 'accept' ? 'Bid accepted.' : 'Bid declined.')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        className="btn btn--gold btn--sm"
        disabled={loading !== null}
        onClick={() => update('accept')}
      >
        {loading === 'accept' && <Spinner size={13} color="#0a0a0a" />}
        Accept
      </button>
      <button
        className="btn btn--ghost btn--sm"
        disabled={loading !== null}
        onClick={() => update('reject')}
        style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
      >
        {loading === 'reject' && <Spinner size={13} />}
        Decline
      </button>
    </div>
  )
}
