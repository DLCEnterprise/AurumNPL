'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id:          string
  label:       string
  completed:   boolean
  completedBy: string | null
  completedAt: string | null
  sortOrder:   number
}

interface Props {
  listingId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DueDiligenceTracker({ listingId }: Props) {
  const [items,    setItems]    = useState<ChecklistItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [adding,   setAdding]   = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [editVal,  setEditVal]  = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchItems = () => {
    fetch(`/api/listings/${listingId}/due-diligence`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setItems(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchItems() }, [listingId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add ────────────────────────────────────────────────────────────────────

  const addItem = async () => {
    const label = newLabel.trim()
    if (!label) return
    setAdding(true)
    const res = await fetch(`/api/listings/${listingId}/due-diligence`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ label }),
    })
    const data = await res.json()
    setAdding(false)
    if (data.success) {
      setItems((prev) => [...prev, data.data])
      setNewLabel('')
    }
  }

  // ── Toggle completed ───────────────────────────────────────────────────────

  const toggleItem = async (item: ChecklistItem) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, completed: !i.completed } : i)
    )
    const res = await fetch(
      `/api/listings/${listingId}/due-diligence?checklistId=${item.id}`,
      {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ completed: !item.completed }),
      }
    )
    const data = await res.json()
    if (data.success) {
      setItems((prev) => prev.map((i) => i.id === item.id ? data.data : i))
    } else {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, completed: item.completed } : i)
      )
    }
  }

  // ── Edit label ─────────────────────────────────────────────────────────────

  const startEdit = (item: ChecklistItem) => {
    setEditId(item.id)
    setEditVal(item.label)
    setTimeout(() => editRef.current?.focus(), 50)
  }

  const saveEdit = async (item: ChecklistItem) => {
    const label = editVal.trim()
    setEditId(null)
    if (!label || label === item.label) return
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, label } : i))
    const res = await fetch(
      `/api/listings/${listingId}/due-diligence?checklistId=${item.id}`,
      {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ label }),
      }
    )
    const data = await res.json()
    if (data.success) {
      setItems((prev) => prev.map((i) => i.id === item.id ? data.data : i))
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch(
      `/api/listings/${listingId}/due-diligence?checklistId=${id}`,
      { method: 'DELETE' }
    )
  }

  // ── Progress ───────────────────────────────────────────────────────────────

  const total     = items.length
  const completed = items.filter((i) => i.completed).length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="glass-card" style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          Due Diligence Checklist
        </div>
        {total > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--gold-400)' }}>
            {completed}/{total} completed
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            height:       4,
            borderRadius: 9999,
            background:   'rgba(255,255,255,0.06)',
            overflow:     'hidden',
          }}>
            <div style={{
              height:     '100%',
              width:      `${pct}%`,
              background: 'var(--gold-gradient)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
            {pct}%
          </div>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: items.length > 0 ? '20px' : '0' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           '10px',
                padding:       '8px 10px',
                borderRadius:  'var(--radius-sm)',
                background:    'rgba(255,255,255,0.02)',
                border:        '1px solid transparent',
                transition:    'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleItem(item)}
                style={{
                  width:        18,
                  height:       18,
                  borderRadius: 4,
                  border:       item.completed ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                  background:   item.completed ? 'var(--gold-gradient)' : 'transparent',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  flexShrink:   0,
                  cursor:       'pointer',
                  padding:      0,
                }}
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.completed && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>

              {/* Label (editable) */}
              {editId === item.id ? (
                <input
                  ref={editRef}
                  type="text"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onBlur={() => saveEdit(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(item)
                    if (e.key === 'Escape') setEditId(null)
                  }}
                  maxLength={200}
                  style={{
                    flex:       1,
                    background: 'transparent',
                    border:     'none',
                    borderBottom: '1px solid var(--gold-400)',
                    color:      'var(--text-primary)',
                    fontSize:   '0.875rem',
                    outline:    'none',
                    padding:    '0 2px',
                  }}
                />
              ) : (
                <span
                  onClick={() => !item.completed && startEdit(item)}
                  style={{
                    flex:           1,
                    fontSize:       '0.875rem',
                    color:          item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: item.completed ? 'line-through' : 'none',
                    cursor:         item.completed ? 'default' : 'text',
                    userSelect:     'none',
                  }}
                >
                  {item.label}
                </span>
              )}

              {/* Completed by */}
              {item.completed && item.completedBy && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {item.completedBy}
                </span>
              )}

              {/* Delete button */}
              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  background:    'none',
                  border:        'none',
                  padding:       '2px',
                  color:         'var(--text-muted)',
                  cursor:        'pointer',
                  display:       'flex',
                  alignItems:    'center',
                  opacity:       0.6,
                  flexShrink:    0,
                  lineHeight:    1,
                }}
                aria-label="Delete item"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.6' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Add a checklist item…"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
          maxLength={200}
          style={{ flex: 1 }}
          disabled={adding}
        />
        <button
          className="btn btn--gold btn--sm"
          onClick={addItem}
          disabled={adding || !newLabel.trim()}
          style={{ whiteSpace: 'nowrap' }}
        >
          {adding ? '…' : 'Add'}
        </button>
      </div>
    </div>
  )
}
