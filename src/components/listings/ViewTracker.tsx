'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  listingId: string
}

export function ViewTracker({ listingId }: ViewTrackerProps) {
  useEffect(() => {
    fetch(`/api/listings/${listingId}/view`, { method: 'POST' })
  }, [listingId])

  return null
}
