'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

interface ExistingBid {
  id: string
  amount: number
  noteRate: number | null
  status: string
}

interface Props {
  listingId: string
  existingBid: ExistingBid | null
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Pending Review',
  ACCEPTED:  'Accepted',
  REJECTED:  'Declined',
  WITHDRAWN: 'Withdrawn',
  COUNTERED: 'Countered',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING:   'var(--gold-400)',
  ACCEPTED:  '#34d399',
  REJECTED:  '#f87171',
  WITHDRAWN: 'var(--text-muted)',
  COUNTERED: '#60a5fa',
}

export function BidButton({ listingId, existingBid }: Props) {
  const router = useRouter()
  const toast  = useToast()
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [amount,   setAmount]   = useState('')
  const [noteRate, setNoteRate] = useState('')
  const [message,  setMessage]  = useState('')

  const submit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Enter a valid bid amount.'); return }

    setLoading(true)
    const res = await fetch(`/api/listings/${listingId}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:   amt,
        noteRate: noteRate ? parseFloat(noteRate) : undefined,
        message:  message || undefined,
      }),
    })
    setLoading(false)

    const data = await res.json()
    if (!res.ok || !data.success) {
      toast.error(data.error ?? 'Failed to submit bid.')
      return
    }

    toast.success('Bid submitted successfully.')
    setOpen(false)
    router.refresh()
  }

  // Show existing bid status
  if (existingBid && !open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
            Your Bid
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(existingBid.amount)}
          </div>
          <span style={{ fontSize: '0.75rem', color: STATUS_COLOR[existingBid.status] ?? 'var(--text-muted)' }}>
            {STATUS_LABEL[existingBid.status] ?? existingBid.status}
          </span>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <button className="btn btn--gold" onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Submit Bid / LOI
      </button>
    )
  }

  return (
    <div className="glass-card" style={{ padding: '20px', width: '100%', maxWidth: '500px' }}>
      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, marginBottom: '16px' }}>
        Submit Bid / LOI
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Amount (USD) *
          </label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g. 500000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="1"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Note Rate (%)
          </label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g. 5.5"
            value={noteRate}
            onChange={(e) => setNoteRate(e.target.value)}
            min="0"
            max="100"
            step="0.01"
          />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Message (optional)
        </label>
        <textarea
          className="form-input"
          rows={4}
          placeholder="Include any terms, conditions, or notes for the seller…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn btn--gold" disabled={loading || !amount} onClick={submit}>
          {loading && <Spinner size={15} color="#0a0a0a" />}
          {loading ? 'Submitting…' : 'Submit Bid'}
        </button>
        <button className="btn btn--ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  )
}
