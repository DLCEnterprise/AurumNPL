'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface User {
  id: string
  name: string | null
  email: string
  company: string | null
  phone: string | null
  role: string
  approvalStatus: string
  pendingRoleRequest: string | null
  adminNotes: string | null
  suspendedAt: string | null
  suspendedReason: string | null
  entityName: string | null
  signerTitle: string | null
  yearsExperience: number | null
  investorType: string | null
  lienPosition: string | null
  loanStatusPref: string | null
  mainObjective: string | null
}

const STATUS_COLOR: Record<string, string> = {
  APPROVED:  '#4ade80',
  PENDING:   'var(--gold-300)',
  REJECTED:  '#f87171',
  SUSPENDED: '#fb923c',
}

const STATUS_BG: Record<string, string> = {
  APPROVED:  'rgba(34,197,94,0.08)',
  PENDING:   'rgba(212,168,70,0.1)',
  REJECTED:  'rgba(239,68,68,0.08)',
  SUSPENDED: 'rgba(251,146,60,0.08)',
}

const STATUS_BORDER: Record<string, string> = {
  APPROVED:  'rgba(34,197,94,0.25)',
  PENDING:   'rgba(212,168,70,0.3)',
  REJECTED:  'rgba(239,68,68,0.25)',
  SUSPENDED: 'rgba(251,146,60,0.25)',
}

export function AdminUserEditor({ user: initial }: { user: User }) {
  const router = useRouter()
  const toast  = useToast()

  const [saving,    setSaving]    = useState(false)
  const [notes,     setNotes]     = useState(initial.adminNotes ?? '')
  const [reason,    setReason]    = useState(initial.suspendedReason ?? '')
  const [showSuspendInput, setShowSuspendInput] = useState(false)
  const [status,    setStatus]    = useState(initial.approvalStatus)
  const [suspendedAt,     setSuspendedAt]     = useState<string | null>(initial.suspendedAt)
  const [suspendedReason, setSuspendedReason] = useState<string | null>(initial.suspendedReason)

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Update failed.'); return false }
      return true
    } finally {
      setSaving(false)
    }
  }

  const saveNotes = async () => {
    const ok = await patch({ adminNotes: notes || null })
    if (ok) toast.success('Notes saved.')
  }

  const handleSuspend = async () => {
    const ok = await patch({ approvalStatus: 'SUSPENDED', suspendedReason: reason || null })
    if (ok) {
      toast.success('User suspended.')
      setStatus('SUSPENDED')
      setSuspendedAt(new Date().toISOString())
      setSuspendedReason(reason || null)
      setShowSuspendInput(false)
      router.refresh()
    }
  }

  const handleUnsuspend = async () => {
    const ok = await patch({ approvalStatus: 'APPROVED' })
    if (ok) {
      toast.success('User restored to approved.')
      setStatus('APPROVED')
      setSuspendedAt(null)
      setSuspendedReason(null)
      router.refresh()
    }
  }

  const handleApprove = async () => {
    const ok = await patch({ approvalStatus: 'APPROVED' })
    if (ok) { toast.success('User approved.'); setStatus('APPROVED'); router.refresh() }
  }

  const handleReject = async () => {
    const ok = await patch({ approvalStatus: 'REJECTED' })
    if (ok) { toast.success('User rejected.'); setStatus('REJECTED'); router.refresh() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Status + quick actions */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Account Status
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
            background: STATUS_BG[status] ?? 'rgba(255,255,255,0.05)',
            color: STATUS_COLOR[status] ?? 'var(--text-muted)',
            border: `1px solid ${STATUS_BORDER[status] ?? 'rgba(255,255,255,0.1)'}`,
          }}>
            {status}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Role: <strong style={{ color: 'var(--text-primary)' }}>{initial.role}</strong>
            {initial.pendingRoleRequest && (
              <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: 'var(--gold-300)' }}>
                (requesting {initial.pendingRoleRequest})
              </span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {status === 'PENDING' && (
            <>
              <button className="btn btn--gold btn--sm" onClick={handleApprove} disabled={saving}>
                Approve
              </button>
              <button className="btn btn--ghost btn--sm" onClick={handleReject} disabled={saving}
                style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
                Reject
              </button>
            </>
          )}
          {(status === 'APPROVED' || status === 'REJECTED') && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setShowSuspendInput((v) => !v)}
              disabled={saving}
              style={{ color: '#fb923c', borderColor: 'rgba(251,146,60,0.2)' }}
            >
              Suspend User
            </button>
          )}
          {status === 'SUSPENDED' && (
            <button className="btn btn--gold btn--sm" onClick={handleUnsuspend} disabled={saving}>
              Restore Access
            </button>
          )}
        </div>

        {/* Suspend reason input */}
        {showSuspendInput && (
          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Suspension reason (optional, admin-only)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Violated terms of service"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              style={{ marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn--sm" onClick={handleSuspend} disabled={saving}
                style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}>
                Confirm Suspend
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowSuspendInput(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Show suspension info if suspended */}
        {status === 'SUSPENDED' && suspendedAt && (
          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: '#fb923c', marginBottom: '4px' }}>
              Suspended {new Date(suspendedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {suspendedReason && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{suspendedReason}</div>
            )}
          </div>
        )}
      </div>

      {/* User details (read-only) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '14px' }}>
          User Details
        </div>
        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
          {[
            { label: 'Email', value: initial.email },
            { label: 'Company', value: initial.company ?? '—' },
            { label: 'Phone', value: initial.phone ?? '—' },
            { label: 'Entity Name', value: initial.entityName ?? '—' },
            { label: 'Signer Title', value: initial.signerTitle ?? '—' },
            { label: 'Years Experience', value: initial.yearsExperience != null ? String(initial.yearsExperience) : '—' },
            { label: 'Investor Type', value: initial.investorType ?? '—' },
            { label: 'Lien Preference', value: initial.lienPosition ?? '—' },
            { label: 'Loan Status Pref', value: initial.loanStatusPref ?? '—' },
            { label: 'Main Objective', value: initial.mainObjective ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '3px' }}>
                {label}
              </dt>
              <dd style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Admin notes */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Admin Notes
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Internal only — never visible to the user.
        </p>
        <textarea
          className="form-input"
          rows={8}
          placeholder="Add notes about this user…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={10000}
          style={{ resize: 'vertical', marginBottom: '12px', fontFamily: 'inherit', fontSize: '0.88rem', lineHeight: 1.7 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn--gold btn--sm" onClick={saveNotes} disabled={saving}>
            {saving ? 'Saving…' : 'Save Notes'}
          </button>
          {notes !== (initial.adminNotes ?? '') && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  )
}
