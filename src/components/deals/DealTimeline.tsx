'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

interface MlpaData { body: string; version: string }

interface Props {
  timelineId: string
  isSeller: boolean
  bidAcceptedAt: string
  bpoOeDeadline: string
  bpoOrderedAt: string | null
  oeOrderedAt: string | null
  ddDeadline: string
  ddCompletedAt: string | null
  mlpaSentAt: string | null
  mlpaSignedAt: string | null
  wireReceivedAt: string | null
  closedAt: string | null
  notes: string | null
}

function fmtDate(s: string | null | undefined) {
  if (!s) return null
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function deadlineLabel(deadline: string): { label: string; urgent: boolean; overdue: boolean } {
  const ms = new Date(deadline).getTime() - Date.now()
  const days = Math.floor(ms / 86_400_000)
  if (ms < 0) return { label: `Overdue by ${Math.abs(days)}d`, urgent: false, overdue: true }
  if (days === 0) return { label: 'Due today', urgent: true, overdue: false }
  if (days <= 2) return { label: `Due in ${days}d`, urgent: true, overdue: false }
  return { label: `Due ${fmtDate(deadline)}`, urgent: false, overdue: false }
}

function Step({
  done,
  label,
  doneAt,
  deadline,
  children,
}: {
  done: boolean
  label: string
  doneAt?: string | null
  deadline?: string
  children?: React.ReactNode
}) {
  const dl = deadline && !done ? deadlineLabel(deadline) : null

  return (
    <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
      {/* Icon */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${done ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.08)'}`,
          flexShrink: 0,
        }}>
          {done ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: children ? '8px' : 0 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: done ? 400 : 500, color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {label}
          </span>
          {done && doneAt && (
            <span style={{ fontSize: '0.7rem', color: '#34d399' }}>{fmtDate(doneAt)}</span>
          )}
          {dl && (
            <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: '100px', fontWeight: 600, background: dl.overdue ? 'rgba(239,68,68,0.1)' : dl.urgent ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.05)', color: dl.overdue ? '#f87171' : dl.urgent ? '#fb923c' : 'var(--text-muted)', border: `1px solid ${dl.overdue ? 'rgba(239,68,68,0.2)' : dl.urgent ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
              {dl.label}
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

export function DealTimeline({
  timelineId,
  isSeller,
  bidAcceptedAt,
  bpoOeDeadline,
  bpoOrderedAt,
  oeOrderedAt,
  ddDeadline,
  ddCompletedAt,
  mlpaSentAt,
  mlpaSignedAt,
  wireReceivedAt,
  closedAt,
  notes: initialNotes,
}: Props) {
  const router = useRouter()
  const toast  = useToast()
  const [saving, setSaving]         = useState<string | null>(null)
  const [notes, setNotes]           = useState(initialNotes ?? '')
  const [notesSaving, setNotesSaving] = useState(false)
  const [mlpa, setMlpa]             = useState<MlpaData | null>(null)
  const [mlpaLoading, setMlpaLoading] = useState(false)

  const now = new Date().toISOString()

  const markStep = async (field: string, value: string | null) => {
    setSaving(field)
    try {
      const res = await fetch(`/api/deals/${timelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Failed to update.')
      } else {
        toast.success('Updated.')
        router.refresh()
      }
    } catch {
      toast.error('Failed to update.')
    } finally {
      setSaving(null)
    }
  }

  const saveNotes = async () => {
    setNotesSaving(true)
    try {
      const res = await fetch(`/api/deals/${timelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Notes saved.')
        router.refresh()
      } else {
        toast.error(data.error ?? 'Failed to save notes.')
      }
    } catch {
      toast.error('Failed to save notes.')
    } finally {
      setNotesSaving(false)
    }
  }

  const CheckBtn = ({ field, doneAt, label }: { field: string; doneAt: string | null; label: string }) => {
    if (!isSeller) return null
    const isMarked = !!doneAt
    return (
      <button
        type="button"
        onClick={() => markStep(field, isMarked ? null : now)}
        disabled={!!saving}
        style={{
          fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
          border: '1px solid', transition: 'all 0.15s',
          background: isMarked ? 'rgba(248,113,113,0.06)' : 'rgba(52,211,153,0.08)',
          borderColor: isMarked ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)',
          color: isMarked ? '#f87171' : '#34d399',
        }}
      >
        {saving === field ? <Spinner size={11} /> : isMarked ? `Undo` : label}
      </button>
    )
  }

  const generateMlpa = async () => {
    setMlpaLoading(true)
    try {
      const res = await fetch(`/api/deals/${timelineId}/mlpa`)
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error ?? 'Failed to generate MLPA.'); return }
      setMlpa(data.data)
    } catch { toast.error('Failed to generate MLPA.') }
    finally { setMlpaLoading(false) }
  }

  const copyMlpa = () => {
    if (!mlpa) return
    navigator.clipboard.writeText(mlpa.body)
    toast.success('Copied to clipboard.')
  }

  return (
    <div>
      {/* MLPA modal */}
      {mlpa && (
        <>
          <div onClick={() => setMlpa(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: '5vh', left: '50%', transform: 'translateX(-50%)', zIndex: 201, width: '90%', maxWidth: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>MLPA — {mlpa.version}</span>
                <span style={{ marginLeft: '10px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Generated {fmtDate(new Date().toISOString())}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn--ghost btn--sm" onClick={copyMlpa}>Copy</button>
                <button onClick={() => setMlpa(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <pre style={{ flex: 1, overflowY: 'auto', padding: '24px', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {mlpa.body}
            </pre>
          </div>
        </>
      )}

      {/* Steps */}
      <div style={{ position: 'relative' }}>
        {/* Connector line */}
        <div style={{ position: 'absolute', left: '13px', top: '28px', bottom: '0', width: '1px', background: 'rgba(255,255,255,0.06)' }} />

        <Step done label="Offer Accepted" doneAt={bidAcceptedAt} />

        <Step
          done={!!bpoOrderedAt && !!oeOrderedAt}
          label="BPO / O&E Ordered"
          doneAt={bpoOrderedAt && oeOrderedAt ? (bpoOrderedAt > oeOrderedAt ? bpoOrderedAt : oeOrderedAt) : null}
          deadline={bpoOeDeadline}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              BPO: {bpoOrderedAt ? <span style={{ color: '#34d399' }}>{fmtDate(bpoOrderedAt)}</span> : 'Pending'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              O&E: {oeOrderedAt ? <span style={{ color: '#34d399' }}>{fmtDate(oeOrderedAt)}</span> : 'Pending'}
            </div>
          </div>
          {isSeller && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <CheckBtn field="bpoOrderedAt" doneAt={bpoOrderedAt} label="Mark BPO Ordered" />
              <CheckBtn field="oeOrderedAt" doneAt={oeOrderedAt} label="Mark O&E Ordered" />
            </div>
          )}
        </Step>

        <Step
          done={!!ddCompletedAt}
          label="Due Diligence Complete"
          doneAt={ddCompletedAt}
          deadline={ddDeadline}
        >
          {isSeller && (
            <CheckBtn field="ddCompletedAt" doneAt={ddCompletedAt} label="Mark DD Complete" />
          )}
        </Step>

        <Step done={!!mlpaSentAt && !!mlpaSignedAt} label="MLPA" doneAt={mlpaSignedAt}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Sent: {mlpaSentAt ? <span style={{ color: '#34d399' }}>{fmtDate(mlpaSentAt)}</span> : 'Pending'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Signed: {mlpaSignedAt ? <span style={{ color: '#34d399' }}>{fmtDate(mlpaSignedAt)}</span> : 'Pending'}
            </div>
          </div>
          {isSeller && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <CheckBtn field="mlpaSentAt" doneAt={mlpaSentAt} label="Mark MLPA Sent" />
              <CheckBtn field="mlpaSignedAt" doneAt={mlpaSignedAt} label="Mark MLPA Signed" />
            </div>
          )}
        </Step>

        <Step done={!!wireReceivedAt} label="Wire Received" doneAt={wireReceivedAt}>
          {isSeller && (
            <CheckBtn field="wireReceivedAt" doneAt={wireReceivedAt} label="Mark Wire Received" />
          )}
        </Step>

        <Step done={!!closedAt} label="Closed" doneAt={closedAt}>
          {isSeller && (
            <CheckBtn field="closedAt" doneAt={closedAt} label="Mark Closed" />
          )}
        </Step>
      </div>

      {/* Generate MLPA */}
      <div style={{ paddingTop: '4px', paddingBottom: '4px' }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={generateMlpa}
          disabled={mlpaLoading}
          style={{ fontSize: '0.75rem' }}
        >
          {mlpaLoading ? <Spinner size={12} /> : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          )}
          {mlpaLoading ? 'Generating…' : 'Generate MLPA'}
        </button>
      </div>

      {/* Notes (seller/admin only) */}
      {isSeller && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Deal Notes
          </div>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Internal notes for this deal…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ resize: 'vertical', marginBottom: '8px' }}
            maxLength={2000}
          />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={saveNotes}
            disabled={notesSaving}
          >
            {notesSaving && <Spinner size={12} />}
            {notesSaving ? 'Saving…' : 'Save Notes'}
          </button>
        </div>
      )}

      {/* Read-only notes for buyer if present */}
      {!isSeller && initialNotes && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Notes</div>
          {initialNotes}
        </div>
      )}
    </div>
  )
}
