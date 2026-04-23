'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

interface Template {
  id: string
  version: string
  body: string
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TokenDef { token: string; description: string }

interface Props {
  initialTemplates: Template[]
  defaultBody: string
  availableTokens: TokenDef[]
}

export function MlpaEditor({ initialTemplates, defaultBody, availableTokens }: Props) {
  const router = useRouter()
  const toast  = useToast()

  const active = initialTemplates.find(t => t.isActive) ?? null
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [editingId, setEditingId] = useState<string | 'new' | null>(active ? active.id : 'new')

  const [version, setVersion]   = useState(active?.version ?? 'v1.0')
  const [body,    setBody]       = useState(active?.body ?? defaultBody)
  const [notes,   setNotes]      = useState(active?.notes ?? '')
  const [saving,  setSaving]     = useState(false)
  const [deleting, setDeleting]  = useState<string | null>(null)

  const startNew = () => {
    setEditingId('new')
    setVersion(`v${templates.length + 1}.0`)
    setBody(defaultBody)
    setNotes('')
  }

  const startEdit = (t: Template) => {
    setEditingId(t.id)
    setVersion(t.version)
    setBody(t.body)
    setNotes(t.notes ?? '')
  }

  const save = async () => {
    if (!version.trim() || !body.trim()) { toast.error('Version and body are required.'); return }
    setSaving(true)
    try {
      const isNew = editingId === 'new'
      const url   = isNew ? '/api/admin/mlpa' : `/api/admin/mlpa/${editingId}`
      const method = isNew ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: version.trim(), body, notes: notes.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error ?? 'Failed to save.'); return }
      if (isNew) {
        setTemplates(prev => [data.data, ...prev])
        setEditingId(data.data.id)
      } else {
        setTemplates(prev => prev.map(t => t.id === editingId ? data.data : t))
      }
      toast.success('Template saved.')
      router.refresh()
    } catch { toast.error('Failed to save.') }
    finally { setSaving(false) }
  }

  const setActive = async (id: string) => {
    // Deactivate all, then activate this one
    for (const t of templates) {
      if (t.isActive && t.id !== id) {
        await fetch(`/api/admin/mlpa/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: false }) })
      }
    }
    const res = await fetch(`/api/admin/mlpa/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }) })
    const data = await res.json()
    if (res.ok && data.success) {
      setTemplates(prev => prev.map(t => ({ ...t, isActive: t.id === id })))
      toast.success('Active template updated.')
      router.refresh()
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template version?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/mlpa/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        if (editingId === id) startNew()
        toast.success('Template deleted.')
        router.refresh()
      }
    } catch { toast.error('Failed to delete.') }
    finally { setDeleting(null) }
  }

  const insertToken = (token: string) => {
    const ta = document.getElementById('mlpa-body') as HTMLTextAreaElement | null
    if (!ta) { setBody(prev => prev + token); return }
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const next  = body.slice(0, start) + token + body.slice(end)
    setBody(next)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + token.length, start + token.length) }, 0)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px', alignItems: 'start' }}>

      {/* Left: version list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="btn btn--gold btn--sm" style={{ width: '100%' }} onClick={startNew}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Version
        </button>

        {editingId === 'new' && (
          <div className="glass-card" style={{ padding: '10px 12px', borderColor: 'rgba(212,168,70,0.3)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-300)' }}>New (unsaved)</div>
          </div>
        )}

        {templates.map(t => (
          <div
            key={t.id}
            onClick={() => startEdit(t)}
            className="glass-card"
            style={{ padding: '10px 12px', cursor: 'pointer', borderColor: editingId === t.id ? 'rgba(212,168,70,0.3)' : undefined }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{t.version}</span>
              {t.isActive && (
                <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '100px', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600 }}>ACTIVE</span>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        ))}
      </div>

      {/* Right: editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Version + actions row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <input
              className="form-input"
              placeholder="Version (e.g. v1.0)"
              value={version}
              onChange={e => setVersion(e.target.value)}
              style={{ maxWidth: '200px' }}
            />
          </div>
          <button className="btn btn--gold btn--sm" onClick={save} disabled={saving}>
            {saving && <Spinner size={13} color="#0a0a0a" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
          {editingId && editingId !== 'new' && !templates.find(t => t.id === editingId)?.isActive && (
            <button className="btn btn--ghost btn--sm" onClick={() => setActive(editingId)}>
              Set Active
            </button>
          )}
          {editingId && editingId !== 'new' && (
            <button
              className="btn btn--sm"
              style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
              disabled={deleting === editingId}
              onClick={() => deleteTemplate(editingId)}
            >
              {deleting === editingId ? <Spinner size={12} /> : 'Delete'}
            </button>
          )}
        </div>

        {/* Token reference */}
        <details style={{ fontSize: '0.78rem' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--gold-400)', userSelect: 'none', marginBottom: '8px' }}>
            Available tokens (click to insert)
          </summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px 0' }}>
            {availableTokens.map(({ token, description }) => (
              <button
                key={token}
                type="button"
                title={description}
                onClick={() => insertToken(token)}
                style={{ fontSize: '0.7rem', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(212,168,70,0.2)', background: 'rgba(212,168,70,0.06)', color: 'var(--gold-300)', cursor: 'pointer' }}
              >
                {token}
              </button>
            ))}
          </div>
        </details>

        {/* Body textarea */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Template Body</label>
          <textarea
            id="mlpa-body"
            className="form-input"
            rows={32}
            value={body}
            onChange={e => setBody(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.7 }}
          />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {body.length.toLocaleString()} characters
          </div>
        </div>

        {/* Notes */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Internal Notes</label>
          <textarea
            className="form-input"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Changes from previous version, legal review notes…"
            style={{ resize: 'vertical' }}
            maxLength={500}
          />
        </div>
      </div>
    </div>
  )
}
