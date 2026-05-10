'use client'

import { useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'

interface Props {
  listingId: string
  initialSaved: boolean
}

export function SaveListingButton({ listingId, initialSaved }: Props) {
  const toast = useToast()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const iconControls = useAnimationControls()

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    const wasSaved = saved
    setSaved(!wasSaved)

    if (!wasSaved) {
      iconControls.start({
        scale: [1, 1.45, 0.9, 1.12, 1],
        transition: { duration: 0.42, times: [0, 0.28, 0.5, 0.74, 1], ease: 'easeOut' },
      })
    }

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
    <motion.button
      onClick={toggle}
      className="btn btn--ghost"
      disabled={loading}
      title={saved ? 'Remove from watchlist' : 'Save to watchlist'}
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      <motion.svg
        animate={iconControls}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={saved ? 'var(--gold-400)' : 'none'}
        stroke={saved ? 'var(--gold-400)' : 'currentColor'}
        strokeWidth="2"
        style={{ flexShrink: 0 }}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </motion.svg>
      {saved ? 'Saved' : 'Save'}
    </motion.button>
  )
}
