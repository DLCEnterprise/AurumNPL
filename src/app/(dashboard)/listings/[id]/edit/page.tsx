'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Skeleton'

interface ListingData {
  id: string
  title: string
  description: string | null
  assetType: string
  unpaidBalance: number
  loanCount: number
  location: string
  region: string | null
  avgDelinquency: number | null
  status: string
}

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<ListingData>>({})

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const l = data.data
          setForm({
            title: l.title,
            description: l.description ?? '',
            assetType: l.assetType,
            unpaidBalance: l.unpaidBalance,
            loanCount: l.loanCount,
            location: l.location,
            region: l.region ?? '',
            avgDelinquency: l.avgDelinquency ?? '',
            status: l.status,
          })
        }
        setLoading(false)
      })
  }, [id])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const body: Record<string, unknown> = { ...form }
    if (body.unpaidBalance) body.unpaidBalance = parseFloat(String(body.unpaidBalance))
    if (body.loanCount) body.loanCount = parseInt(String(body.loanCount))
    if (body.avgDelinquency !== '' && body.avgDelinquency != null)
      body.avgDelinquency = parseInt(String(body.avgDelinquency))
    else delete body.avgDelinquency

    const res = await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      router.push(`/listings/${id}`)
      router.refresh()
    } else {
      setError(data.error ?? 'Save failed.')
    }
  }

  const field = (label: string, key: string, type = 'text', opts?: Record<string, unknown>) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type}
        value={String(form[key as keyof typeof form] ?? '')}
        onChange={e => set(key, e.target.value)}
        className="input"
        style={{ width: '100%' }}
        {...opts}
      />
    </div>
  )

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}><Spinner size={24} /></div>

  return (
    <div style={{ maxWidth: '640px' }}>
      <Link href={`/listings/${id}`} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to Listing
      </Link>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '28px' }}>
        Edit Listing
      </h1>

      <div className="glass-card" style={{ padding: '28px' }}>
        {field('Title', 'title')}
        {field('Location (City, State)', 'location')}
        {field('Zip Code', 'zip')}
        {field('State / Region', 'region')}
        {field('Unpaid Balance (UPB)', 'unpaidBalance', 'number')}
        {field('Number of Loans', 'loanCount', 'number')}
        {field('Avg. Delinquency (months)', 'avgDelinquency', 'number')}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Asset Type
          </label>
          <select value={form.assetType ?? ''} onChange={e => set('assetType', e.target.value)} className="input" style={{ width: '100%' }}>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="CONSUMER">Consumer</option>
            <option value="MIXED">Mixed</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Status
          </label>
          <select value={form.status ?? ''} onChange={e => set('status', e.target.value)} className="input" style={{ width: '100%' }}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PENDING">Pending</option>
            <option value="SOLD">Sold</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Description
          </label>
          <textarea
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            className="input"
            rows={4}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        {error && <div className="alert alert--error" style={{ marginBottom: '16px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn--gold" onClick={handleSave} disabled={saving}>
            {saving && <Spinner size={14} color="#0a0a0a" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href={`/listings/${id}`} className="btn btn--ghost">Cancel</Link>
        </div>
      </div>
    </div>
  )
}
