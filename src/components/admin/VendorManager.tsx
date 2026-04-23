'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

const CATEGORIES = ['BPO', 'Title / O&E', 'Legal', 'Other'] as const
type Category = typeof CATEGORIES[number]

interface Vendor {
  id: string
  name: string
  category: string
  description: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  website: string | null
  address: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const EMPTY_FORM = {
  name: '', category: 'BPO' as Category,
  description: '', contactName: '', contactPhone: '',
  contactEmail: '', website: '', address: '',
  isActive: true, sortOrder: 0,
}

const CATEGORY_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  'BPO':         { bg: 'rgba(212,168,70,0.1)',  color: 'var(--gold-300)',  border: 'rgba(212,168,70,0.25)' },
  'Title / O&E': { bg: 'rgba(59,130,246,0.1)',  color: '#60a5fa',          border: 'rgba(59,130,246,0.25)' },
  'Legal':       { bg: 'rgba(168,85,247,0.08)', color: '#c084fc',          border: 'rgba(168,85,247,0.2)' },
  'Other':       { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'var(--border)' },
}

function CategoryBadge({ category }: { category: string }) {
  const s = CATEGORY_COLOR[category] ?? CATEGORY_COLOR['Other']
  return (
    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '100px', fontWeight: 600, letterSpacing: '0.05em', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {category}
    </span>
  )
}

function VendorForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: typeof EMPTY_FORM
  onSave: (data: typeof EMPTY_FORM) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof EMPTY_FORM, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Name *</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme BPO Services" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Category *</label>
          <select className="form-input" value={form.category} onChange={e => set('category', e.target.value as Category)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: '0.72rem' }}>Description</label>
        <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of services…" maxLength={500} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Contact Name</label>
          <input className="form-input" value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Jane Smith" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Contact Phone</label>
          <input className="form-input" type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+1 (555) 000-0000" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Contact Email</label>
          <input className="form-input" type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="jane@acme.com" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Website</label>
          <input className="form-input" type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://acme.com" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Address</label>
          <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, Dallas, TX 75001" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Sort Order</label>
          <input className="form-input" type="number" style={{ width: '80px' }} value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.72rem', display: 'block' }}>Active</label>
          <button
            type="button"
            onClick={() => set('isActive', !form.isActive)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid', cursor: 'pointer', fontSize: '0.78rem', background: form.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)', borderColor: form.isActive ? 'rgba(52,211,153,0.25)' : 'var(--border)', color: form.isActive ? '#34d399' : 'var(--text-muted)' }}
          >
            {form.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
        <button className="btn btn--gold btn--sm" disabled={saving || !form.name} onClick={() => onSave(form)}>
          {saving && <Spinner size={13} color="#0a0a0a" />}
          {saving ? 'Saving…' : 'Save Vendor'}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export function VendorManager({ initialVendors }: { initialVendors: Vendor[] }) {
  const router  = useRouter()
  const toast   = useToast()
  const [vendors,    setVendors]    = useState<Vendor[]>(initialVendors)
  const [adding,     setAdding]     = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterCat,  setFilterCat]  = useState<string>('All')

  const createVendor = async (form: typeof EMPTY_FORM) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          description:  form.description  || null,
          contactName:  form.contactName  || null,
          contactPhone: form.contactPhone || null,
          contactEmail: form.contactEmail || null,
          website:      form.website      || null,
          address:      form.address      || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error ?? 'Failed to create.'); return }
      setVendors(prev => [...prev, data.data])
      setAdding(false)
      toast.success('Vendor created.')
    } catch { toast.error('Failed to create.') }
    finally { setSaving(false) }
  }

  const updateVendor = async (id: string, form: typeof EMPTY_FORM) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          description:  form.description  || null,
          contactName:  form.contactName  || null,
          contactPhone: form.contactPhone || null,
          contactEmail: form.contactEmail || null,
          website:      form.website      || null,
          address:      form.address      || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error ?? 'Failed to update.'); return }
      setVendors(prev => prev.map(v => v.id === id ? data.data : v))
      setEditingId(null)
      toast.success('Vendor updated.')
    } catch { toast.error('Failed to update.') }
    finally { setSaving(false) }
  }

  const deleteVendor = async (id: string) => {
    if (!confirm('Delete this vendor? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error ?? 'Failed to delete.'); return }
      setVendors(prev => prev.filter(v => v.id !== id))
      toast.success('Vendor deleted.')
      router.refresh()
    } catch { toast.error('Failed to delete.') }
    finally { setDeletingId(null) }
  }

  const toggleActive = async (v: Vendor) => {
    const res = await fetch(`/api/admin/vendors/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !v.isActive }),
    })
    const data = await res.json()
    if (res.ok && data.success) {
      setVendors(prev => prev.map(x => x.id === v.id ? data.data : x))
    }
  }

  const filtered = filterCat === 'All' ? vendors : vendors.filter(v => v.category === filterCat)

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterCat(c)}
              style={{ padding: '5px 12px', borderRadius: '100px', border: '1px solid', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s', background: filterCat === c ? 'rgba(212,168,70,0.1)' : 'rgba(255,255,255,0.04)', borderColor: filterCat === c ? 'rgba(212,168,70,0.35)' : 'var(--border)', color: filterCat === c ? 'var(--gold-300)' : 'var(--text-muted)' }}
            >
              {c}
              {c !== 'All' && (
                <span style={{ marginLeft: '5px', opacity: 0.6 }}>
                  {vendors.filter(v => v.category === c).length}
                </span>
              )}
              {c === 'All' && (
                <span style={{ marginLeft: '5px', opacity: 0.6 }}>{vendors.length}</span>
              )}
            </button>
          ))}
        </div>
        <button className="btn btn--gold btn--sm" onClick={() => { setAdding(true); setEditingId(null) }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Vendor
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '16px', borderColor: 'rgba(212,168,70,0.2)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-300)', marginBottom: '16px' }}>New Vendor</div>
          <VendorForm
            initial={EMPTY_FORM}
            onSave={createVendor}
            onCancel={() => setAdding(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Vendor list */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No vendors{filterCat !== 'All' ? ` in ${filterCat}` : ''}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(v => (
            <div key={v.id} className="glass-card" style={{ overflow: 'hidden', opacity: v.isActive ? 1 : 0.55 }}>
              {editingId === v.id ? (
                <div style={{ padding: '24px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-300)', marginBottom: '16px' }}>Edit Vendor</div>
                  <VendorForm
                    initial={{
                      name: v.name, category: v.category as Category,
                      description: v.description ?? '', contactName: v.contactName ?? '',
                      contactPhone: v.contactPhone ?? '', contactEmail: v.contactEmail ?? '',
                      website: v.website ?? '', address: v.address ?? '',
                      isActive: v.isActive, sortOrder: v.sortOrder,
                    }}
                    onSave={(form) => updateVendor(v.id, form)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  {/* Left: info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{v.name}</span>
                      <CategoryBadge category={v.category} />
                      {!v.isActive && (
                        <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '100px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Inactive</span>
                      )}
                    </div>
                    {v.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.5 }}>{v.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {v.contactName  && <span>👤 {v.contactName}</span>}
                      {v.contactPhone && <span>📞 {v.contactPhone}</span>}
                      {v.contactEmail && <span>✉ {v.contactEmail}</span>}
                      {v.website      && <a href={v.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-400)', textDecoration: 'none' }}>🔗 Website</a>}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      className="btn btn--ghost btn--sm"
                      style={{ fontSize: '0.72rem' }}
                      onClick={() => toggleActive(v)}
                    >
                      {v.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn btn--ghost btn--sm"
                      style={{ fontSize: '0.72rem' }}
                      onClick={() => { setEditingId(v.id); setAdding(false) }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn--sm"
                      style={{ fontSize: '0.72rem', background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                      disabled={deletingId === v.id}
                      onClick={() => deleteVendor(v.id)}
                    >
                      {deletingId === v.id ? <Spinner size={11} /> : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
