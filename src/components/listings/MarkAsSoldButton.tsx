'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function MarkAsSoldButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const toast  = useToast()
  const [loading, setLoading] = useState(false)

  const markSold = async () => {
    if (!confirm('Mark this listing as sold? This will remove it from active listings.')) return
    setLoading(true)
    const res = await fetch(`/api/listings/${listingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SOLD' }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Listing marked as sold.')
      router.refresh()
    } else {
      toast.error('Failed to update listing.')
    }
  }

  return (
    <button
      className="btn btn--ghost"
      onClick={markSold}
      disabled={loading}
      style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.2)' }}
    >
      {loading ? 'Updating…' : 'Mark as Sold'}
    </button>
  )
}
