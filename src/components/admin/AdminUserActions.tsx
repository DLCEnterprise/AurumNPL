'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface AdminUserActionsProps {
  userId: string
  currentStatus: string
  pendingRoleRequest?: string | null
}

export function AdminUserActions({ userId, currentStatus, pendingRoleRequest }: AdminUserActionsProps) {
  const router = useRouter()
  const toast  = useToast()
  const [loading, setLoading] = useState<'approve' | 'reject' | 'grant-role' | 'deny-role' | null>(null)
  const [done, setDone] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [roleRequestDone, setRoleRequestDone] = useState<'granted' | 'denied' | null>(null)

  const effectiveStatus = done ?? currentStatus

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, { method: 'POST' })
      if (res.ok) {
        setDone(action === 'approve' ? 'APPROVED' : 'REJECTED')
        router.refresh()
      } else {
        toast.error(`Failed to ${action} user.`)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleRoleRequest = async (action: 'grant-role' | 'deny-role') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve-role`, {
        method: action === 'grant-role' ? 'POST' : 'DELETE',
      })
      if (res.ok) {
        setRoleRequestDone(action === 'grant-role' ? 'granted' : 'denied')
        router.refresh()
      } else {
        toast.error(`Failed to ${action === 'grant-role' ? 'grant' : 'deny'} role request.`)
      }
    } finally {
      setLoading(null)
    }
  }

  const showRoleRequest = pendingRoleRequest && !roleRequestDone

  if (effectiveStatus === 'APPROVED') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Approved</span>
        {showRoleRequest && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn btn--gold btn--sm"
              onClick={() => handleRoleRequest('grant-role')}
              disabled={loading !== null}
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              title={`Grant ${pendingRoleRequest} role`}
            >
              {loading === 'grant-role' ? '…' : `+ ${pendingRoleRequest}`}
            </button>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => handleRoleRequest('deny-role')}
              disabled={loading !== null}
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
            >
              {loading === 'deny-role' ? '…' : 'Deny'}
            </button>
          </div>
        )}
        {roleRequestDone && (
          <span style={{ fontSize: '0.68rem', color: roleRequestDone === 'granted' ? '#34d399' : 'var(--text-muted)' }}>
            Role {roleRequestDone}
          </span>
        )}
      </div>
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
