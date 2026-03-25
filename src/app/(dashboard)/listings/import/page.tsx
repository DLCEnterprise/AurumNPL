'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Skeleton'
import { ManualAssetForm } from '@/components/listings/ManualAssetForm'

interface Preview {
  address: string | null
  currentBalance: number | null
  loanStatus: string | null
  fairMarketValue: number | null
  ltv: number | null
  propertyState: string | null
}

interface ImportResult {
  listingId: string
  title: string
  warnings: string[]
  criticalMissing: string[]
  preview: Preview
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toLocaleString()}`
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${(n * 100).toFixed(1)}%`
}

type Tab = 'upload' | 'manual'

export default function ImportListingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('upload')

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFile = (f: File) => {
    setError(null)
    setResult(null)
    const name = f.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setError('Only .xlsx and .xls files are accepted.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB.')
      return
    }
    setFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/listings/import', { method: 'POST', body: fd })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Import failed. Please try again.')
      return
    }

    setResult(data.data)
  }

  const handleConfirm = () => {
    if (result) router.push(`/listings/${result.listingId}`)
  }

  const tabStyle = (t: Tab) => ({
    padding: '10px 24px',
    fontSize: '0.82rem',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.15s',
    background: tab === t ? 'var(--gold-400)' : 'transparent',
    color: tab === t ? '#0a0a0a' : 'var(--text-muted)',
  } as React.CSSProperties)

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Back */}
      <Link href="/listings" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to Listings
      </Link>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
          Add a Listing
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Import from a spreadsheet or enter loan data manually.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '28px', width: 'fit-content' }}>
        <button type="button" style={tabStyle('upload')} onClick={() => setTab('upload')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          Import from File
        </button>
        <button type="button" style={tabStyle('manual')} onClick={() => setTab('manual')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Enter Manually
        </button>
      </div>

      {/* ── Upload tab ── */}
      {tab === 'upload' && (
        <>
          {/* Template download */}
          <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-400)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Use the <strong style={{ color: 'var(--text-primary)' }}>Aurum Trader Template</strong> for best results
              </span>
            </div>
            <a
              href="/aurum-trader-template.xlsx"
              download="Aurum Trader Template.xlsx"
              className="btn btn--ghost btn--sm"
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Template
            </a>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              className="glass-card"
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '60px 40px',
                textAlign: 'center',
                cursor: 'pointer',
                border: dragging
                  ? '1.5px solid var(--gold-400)'
                  : file
                  ? '1.5px solid rgba(212,168,70,0.4)'
                  : '1.5px dashed rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-lg)',
                transition: 'border-color 0.2s, background 0.2s',
                background: dragging ? 'rgba(212,168,70,0.04)' : undefined,
                marginBottom: '20px',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={onInputChange} />
              <div style={{ marginBottom: '16px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={file ? 'var(--gold-400)' : 'var(--text-muted)'} strokeWidth="1.5" style={{ margin: '0 auto' }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              {file ? (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{file.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '6px' }}>Drop your .xlsx file here</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>or click to browse · max 10 MB</div>
                </div>
              )}
            </div>
          )}

          {error && <div className="alert alert--error" style={{ marginBottom: '20px' }}>{error}</div>}

          {file && !result && (
            <button className="btn btn--gold btn--full" onClick={handleUpload} disabled={loading} style={{ marginBottom: '20px' }}>
              {loading && <Spinner size={16} color="#0a0a0a" />}
              {loading ? 'Parsing file…' : 'Parse & Preview'}
            </button>
          )}

          {/* Preview card */}
          {result && (
            <div>
              {result.criticalMissing.length > 0 && (
                <div className="alert alert--error" style={{ marginBottom: '16px' }}>
                  <strong>Missing critical fields:</strong> {result.criticalMissing.join(', ')}. The listing was still created but may need manual review.
                </div>
              )}
              {result.warnings.length > 0 && (
                <details style={{ marginBottom: '16px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {result.warnings.length} parser warning{result.warnings.length !== 1 ? 's' : ''}
                  </summary>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {result.warnings.slice(0, 20).map((w, i) => <li key={i}>{w}</li>)}
                    {result.warnings.length > 20 && <li>…and {result.warnings.length - 20} more</li>}
                  </ul>
                </details>
              )}
              <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>Parsed Preview</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '20px' }}>{result.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { label: 'Current Balance', value: fmt(result.preview.currentBalance) },
                    { label: 'Fair Market Value', value: fmt(result.preview.fairMarketValue) },
                    { label: 'LTV', value: fmtPct(result.preview.ltv) },
                    { label: 'Loan Status', value: result.preview.loanStatus ?? '—' },
                    { label: 'State', value: result.preview.propertyState ?? '—' },
                    { label: 'Address', value: result.preview.address ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn--gold" onClick={handleConfirm}>View Listing →</button>
                <button className="btn btn--ghost" onClick={() => { setResult(null); setFile(null) }}>Import Another</button>
              </div>
            </div>
          )}

          {/* Bulk import note */}
          <div className="glass-card" style={{ padding: '16px 20px', marginTop: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-400)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Need to import multiple assets?{' '}
              <Link href="/messages" style={{ color: 'var(--gold-400)' }}>Contact us</Link>
              {' '}for bulk upload access.
            </span>
          </div>
        </>
      )}

      {/* ── Manual tab ── */}
      {tab === 'manual' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Fill in the loan details below. Only Current Balance is required — all other fields are optional and can be added later.
          </p>
          <ManualAssetForm />
        </div>
      )}
    </div>
  )
}
