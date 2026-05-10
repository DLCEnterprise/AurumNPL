'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

interface Props {
  sellerId: string
  listingId: string
  listingTitle: string
}

export function ContactSellerButton({ sellerId, listingId, listingTitle }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(
    `Hi, I'm interested in your listing "${listingTitle}". I'd like to learn more.`
  )
  const [loading, setLoading] = useState(false)

  const send = async () => {
    setLoading(true)

    const res = await fetch('/api/messages/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: sellerId, listingId, message }),
    })

    setLoading(false)
    const data = await res.json()

    if (!res.ok || !data.success) {
      toast.error(data.error ?? 'Failed to send message.')
      return
    }

    router.push(`/messages?convo=${data.data.conversationId}`)
  }

  if (!open) {
    return (
      <button className="btn btn--gold" onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        Contact Seller
      </button>
    )
  }

  const MAX = 1000
  const remaining = MAX - message.length

  return (
    <div className="glass-card" style={{ padding: '20px', minWidth: '280px', maxWidth: '500px' }}>
      <label htmlFor="contact-seller-message" style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
        Send a message
      </label>
      <textarea
        id="contact-seller-message"
        className="form-input"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
        style={{ resize: 'vertical', marginBottom: '6px' }}
        aria-required="true"
      />
      <div style={{ textAlign: 'right', fontSize: '0.72rem', color: remaining < 100 ? 'var(--color-warning, #fbbf24)' : 'var(--text-muted)', marginBottom: '12px' }}>
        {remaining} characters remaining
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn btn--gold" disabled={loading || !message.trim()} onClick={send}>
          {loading && <Spinner size={15} color="#0a0a0a" />}
          {loading ? 'Sending…' : 'Send Message'}
        </button>
        <button className="btn btn--ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  )
}
