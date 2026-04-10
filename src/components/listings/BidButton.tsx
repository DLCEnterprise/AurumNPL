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
  counterAmount?: number | null
  counterNote?: string | null
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
  COUNTERED: '#fb923c',
}

function formatCurrencyLocal(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function BidButton({ listingId, existingBid }: Props) {
  const router = useRouter()
  const toast  = useToast()
  const [open,         setOpen]         = useState(false)
  const [loading,      setLoading]      = useState<boolean | 'accept-counter' | 'decline-counter'>(false)
  const [amount,       setAmount]       = useState('')
  const [noteRate,     setNoteRate]     = useState('')
  const [message,      setMessage]      = useState('')
  const [confirmedBid, setConfirmedBid] = useState<{ amount: number; submittedAt: string } | null>(null)

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
    setConfirmedBid({ amount: amt, submittedAt: new Date().toISOString() })
    router.refresh()
  }

  const respondToCounter = async (action: 'accept-counter' | 'decline-counter') => {
    if (!existingBid) return
    setLoading(action)
    const body =
      action === 'accept-counter'
        ? { status: 'ACCEPTED', amount: existingBid.counterAmount }
        : { status: 'REJECTED' }

    const res = await fetch(`/api/listings/${listingId}/bids/${existingBid.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)

    const data = await res.json()
    if (!res.ok || !data.success) {
      toast.error(data.error ?? 'Action failed.')
      return
    }

    toast.success(action === 'accept-counter' ? 'Counter offer accepted.' : 'Counter offer declined.')
    router.refresh()
  }

  // Optimistic confirmation shown immediately after submit, before server re-renders existingBid
  if (confirmedBid && !existingBid && !open) {
    return (
      <div className="glass-card" style={{ padding: '16px 20px', maxWidth: '500px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(52,211,153,0.12)', color: '#34d399',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#34d399', marginBottom: '2px' }}>
            Bid Submitted
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {formatCurrencyLocal(confirmedBid.amount)} &middot; Pending seller review
          </div>
        </div>
      </div>
    )
  }

  // Counter offer panel for buyer
  if (existingBid && existingBid.status === 'COUNTERED' && !open) {
    return (
      <div className="glass-card" style={{ padding: '18px 20px', maxWidth: '500px' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fb923c', marginBottom: '10px' }}>
          Counter Offer Received
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '3px' }}>Your Bid</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {formatCurrencyLocal(existingBid.amount)}
            </div>
          </div>
          {existingBid.counterAmount != null && (
            <div>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '3px' }}>Counter Amount</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: '#fb923c' }}>
                {formatCurrencyLocal(existingBid.counterAmount)}
              </div>
            </div>
          )}
        </div>
        {existingBid.counterNote && (
          <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {existingBid.counterNote}
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn--gold btn--sm"
            disabled={loading !== false}
            onClick={() => respondToCounter('accept-counter')}
          >
            {loading === 'accept-counter' && <Spinner size={13} color="#0a0a0a" />}
            Accept Counter
          </button>
          <button
            className="btn btn--ghost btn--sm"
            disabled={loading !== false}
            onClick={() => respondToCounter('decline-counter')}
            style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
          >
            {loading === 'decline-counter' && <Spinner size={13} />}
            Decline Counter
          </button>
        </div>
      </div>
    )
  }

  // Show existing bid status (non-COUNTERED)
  if (existingBid && !open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
            Your Bid
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrencyLocal(existingBid.amount)}
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
        <button className="btn btn--gold" disabled={loading !== false || !amount} onClick={submit}>
          {loading === true && <Spinner size={15} color="#0a0a0a" />}
          {loading === true ? 'Submitting…' : 'Submit Bid'}
        </button>
        <button className="btn btn--ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  )
}
