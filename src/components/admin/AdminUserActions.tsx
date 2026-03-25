'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUserActionsProps {
  userId: string
  currentStatus: string
}

export function AdminUserActions({ userId, currentStatus }: AdminUserActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'APPROVED' | 'REJECTED' | null>(null)

  const effectiveStatus = done ?? currentStatus

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
      })
      if (res.ok) {
        setDone(action === 'approve' ? 'APPROVED' : 'REJECTED')
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  if (effectiveStatus === 'APPROVED') {
    return (
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Approved
      </span>
    )
  }

  if (effectiveStatus === 'REJECTED') {
    return (
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Rejected
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button
        className="btn btn--gold btn--sm"
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
      >
        {loading === 'approve' ? '…' : 'Approve'}
      </button>
      <button
        className="btn btn--ghost btn--sm"
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
      >
        {loading === 'reject' ? '…' : 'Reject'}
      </button>
    </div>
  )
}
