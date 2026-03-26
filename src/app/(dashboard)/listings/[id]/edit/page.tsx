'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Skeleton'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

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
  dropboxLink: string | null
  lienPosition: string | null
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
            dropboxLink: l.dropboxLink ?? '',
            lienPosition: l.lienPosition ?? '',
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
      <Breadcrumbs
        items={[
          { label: 'Listings', href: '/listings' },
          { label: form.title ?? 'Edit', href: `/listings/${id}` },
          { label: 'Edit' },
        ]}
      />

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
            Lien Position
          </label>
          <select value={form.lienPosition ?? ''} onChange={e => set('lienPosition', e.target.value)} className="input" style={{ width: '100%' }}>
            <option value="">Select lien position…</option>
            <option value="SENIOR">Senior (1st Mortgage)</option>
            <option value="JUNIOR">Junior (2nd Mortgage)</option>
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

        <div style={{ marginBottom: '20px' }}>
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

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Dropbox Documents Link
          </label>
          <input
            type="url"
            value={String(form.dropboxLink ?? '')}
            onChange={e => set('dropboxLink', e.target.value)}
            className="input"
            placeholder="https://www.dropbox.com/…"
            style={{ width: '100%' }}
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
