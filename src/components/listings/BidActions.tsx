'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [loading,      setLoading]      = useState<'accept' | 'reject' | 'counter' | null>(null)
  const [showCounter,  setShowCounter]  = useState(false)
  const [counterAmount, setCounterAmount] = useState('')
  const [counterNote,  setCounterNote]  = useState('')

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

  const sendCounter = async () => {
    const amt = parseFloat(counterAmount)
    if (!amt || amt <= 0) {
      toast.error('Enter a valid counter amount.')
      return
    }
    setLoading('counter')
    const res = await fetch(`/api/listings/${listingId}/bids/${bidId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status:        'COUNTERED',
        counterAmount: amt,
        counterNote:   counterNote || undefined,
      }),
    })
    setLoading(null)

    const data = await res.json()
    if (!res.ok || !data.success) {
      toast.error(data.error ?? 'Counter offer failed.')
      return
    }

    toast.success('Counter offer sent.')
    setShowCounter(false)
    router.refresh()
  }

  return (
    <div>
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
          onClick={() => setShowCounter((v) => !v)}
          style={{ color: '#fb923c', borderColor: 'rgba(251,146,60,0.25)' }}
        >
          Counter
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

      <AnimatePresence initial={false}>
        {showCounter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="glass-card" style={{ padding: '16px', marginTop: '12px', minWidth: '240px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Counter Offer
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Amount ($)
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 450000"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  min="1"
                  step="1"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Note (optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Brief note to the buyer…"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  maxLength={2000}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn--gold btn--sm"
                  disabled={loading !== null || !counterAmount}
                  onClick={sendCounter}
                >
                  {loading === 'counter' && <Spinner size={13} color="#0a0a0a" />}
                  Send Counter
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={loading !== null}
                  onClick={() => { setShowCounter(false); setCounterAmount(''); setCounterNote('') }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
