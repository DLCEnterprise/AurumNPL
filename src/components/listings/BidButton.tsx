'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'
import { motion, useAnimationControls } from 'framer-motion'
import { AnimatedModal } from '@/components/ui/AnimatedModal'
import { successPopVariants } from '@/lib/motion'

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
  const [amountError,  setAmountError]  = useState('')
  const [confirmedBid, setConfirmedBid] = useState<{ amount: number; submittedAt: string } | null>(null)

  // Animation controls for the shake-on-error effect
  const shakeControls = useAnimationControls()

  const submit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      setAmountError('Enter a valid bid amount.')
      shakeControls.start({
        x: [0, -10, 10, -8, 8, -4, 4, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      })
      return
    }

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
    setAmount('')
    setNoteRate('')
    setMessage('')
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

  // Animated confirmation card shown after successful bid submission
  if (confirmedBid && (!existingBid || existingBid.status === 'REJECTED')) {
    return (
      <motion.div
        variants={successPopVariants}
        initial="hidden"
        animate="visible"
        className="glass-card"
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 22, delay: 0.1 }}
          style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(52,211,153,0.12)', color: '#34d399',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 380, damping: 28 }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#34d399', marginBottom: '2px' }}>Bid Submitted</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {formatCurrencyLocal(confirmedBid.amount)} · Pending seller review
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Counter offer panel for buyer
  if (existingBid && existingBid.status === 'COUNTERED') {
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
          <motion.button
            className="btn btn--gold btn--sm"
            disabled={loading !== false}
            onClick={() => respondToCounter('accept-counter')}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {loading === 'accept-counter' && <Spinner size={13} color="#0a0a0a" />}
            Accept Counter
          </motion.button>
          <motion.button
            className="btn btn--ghost btn--sm"
            disabled={loading !== false}
            onClick={() => respondToCounter('decline-counter')}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
          >
            {loading === 'decline-counter' && <Spinner size={13} />}
            Decline Counter
          </motion.button>
        </div>
      </div>
    )
  }

  // Existing bid status (PENDING, ACCEPTED, WITHDRAWN)
  if (existingBid && existingBid.status !== 'REJECTED') {
    return (
      <div className="glass-card" style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
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
    )
  }

  const isRebid = existingBid?.status === 'REJECTED'

  return (
    <>
      <motion.button
        className="btn btn--gold"
        onClick={() => { setOpen(true); setAmountError('') }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {isRebid ? 'Submit New Bid' : 'Submit Bid / LOI'}
      </motion.button>

      <AnimatedModal open={open} onClose={() => setOpen(false)} maxWidth="520px">
        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, margin: 0, lineHeight: 1.2 }}>
              Submit Bid / LOI
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
              Your offer is non-binding until a purchase agreement is executed.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>

          {isRebid && existingBid && (
            <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Your previous bid of <strong style={{ color: 'var(--text-secondary)' }}>{formatCurrencyLocal(existingBid.amount)}</strong> was declined. Submit a revised offer below.
            </div>
          )}

          {/* Offer amount with shake-on-error */}
          <motion.div animate={shakeControls} style={{ marginBottom: '20px' }}>
            <label htmlFor="bid-amount" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Offer Amount (USD) <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              id="bid-amount"
              type="number"
              className={`form-input${amountError ? ' form-input--error' : ''}`}
              placeholder="e.g. 500,000"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); if (amountError) setAmountError('') }}
              min="1"
              step="1"
              style={{ fontSize: '1.1rem' }}
              autoFocus
              aria-required="true"
              aria-invalid={amountError ? true : undefined}
              aria-describedby={amountError ? 'bid-amount-error' : undefined}
            />
            {amountError && (
              <div id="bid-amount-error" className="form-error" style={{ marginTop: '6px' }}>
                {amountError}
              </div>
            )}
          </motion.div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="bid-note-rate" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Note Rate (%) — optional
            </label>
            <input
              id="bid-note-rate"
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

          <div style={{ marginBottom: '28px' }}>
            <label htmlFor="bid-message" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Message / Terms — optional
            </label>
            <textarea
              id="bid-message"
              className="form-input"
              rows={6}
              placeholder="Include any terms, conditions, or notes for the seller…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              {message.length} / 2000
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(212,168,70,0.06)', border: '1px solid rgba(212,168,70,0.15)', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            By submitting this bid you acknowledge that this is a letter of intent only. A binding agreement requires execution of a purchase and sale agreement.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              className="btn btn--gold"
              disabled={loading !== false || !amount}
              onClick={submit}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              style={{ flex: 1 }}
            >
              {loading === true && <Spinner size={15} color="#0a0a0a" />}
              {loading === true ? 'Submitting…' : 'Submit Bid'}
            </motion.button>
            <button className="btn btn--ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </AnimatedModal>
    </>
  )
}
