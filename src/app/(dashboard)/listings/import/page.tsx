'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Skeleton'
import { ManualAssetForm } from '@/components/listings/ManualAssetForm'
import { parseCSV, parseCsvRow, CSV_HEADERS, type CsvRow } from '@/lib/csv-import'

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

type Tab = 'upload' | 'manual' | 'bulk'

interface BulkPreviewRow {
  rowIndex: number
  title: string
  state: string | null
  balance: number
  fmv: number | null
  lien: string
  warnings: string[]
}

interface BulkImportResult {
  created: number
  failed: number
  results: Array<{ rowIndex: number; listingId: string; title: string; warnings: string[] }>
  errors: Array<{ rowIndex: number; error: string }>
}

export default function ImportListingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef  = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('upload')

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  // Bulk CSV state
  const [csvFile,       setCsvFile]       = useState<File | null>(null)
  const [csvDragging,   setCsvDragging]   = useState(false)
  const [csvRawRows,    setCsvRawRows]    = useState<CsvRow[] | null>(null)
  const [csvRows,       setCsvRows]       = useState<ReturnType<typeof parseCsvRow>[] | null>(null)
  const [csvPreview,    setCsvPreview]    = useState<BulkPreviewRow[] | null>(null)
  const [csvLoading,    setCsvLoading]    = useState(false)
  const [csvError,      setCsvError]      = useState<string | null>(null)
  const [bulkResult,    setBulkResult]    = useState<BulkImportResult | null>(null)

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

  // ── Bulk CSV handlers ───────────────────────────────────────────────────────

  const handleCsvFile = async (f: File) => {
    setCsvError(null)
    setCsvPreview(null)
    setCsvRows(null)
    setCsvRawRows(null)
    setBulkResult(null)
    if (!f.name.toLowerCase().endsWith('.csv')) { setCsvError('Only .csv files are accepted.'); return }
    if (f.size > 5 * 1024 * 1024) { setCsvError('File size exceeds 5 MB.'); return }
    setCsvFile(f)

    // Parse immediately on selection
    try {
      const text = await f.text()
      const rawRows = parseCSV(text)
      if (rawRows.length === 0) { setCsvError('No data rows found in CSV.'); return }
      if (rawRows.length > 200) { setCsvError('Maximum 200 rows allowed per import.'); return }

      // Validate headers
      const firstRow = rawRows[0]
      const missing = CSV_HEADERS.filter(h => !(h in firstRow))
      if (missing.length > CSV_HEADERS.length / 2) {
        setCsvError(`CSV headers don't match the template. Missing: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}. Please download the template.`)
        return
      }

      const parsed = rawRows.map((r, i) => parseCsvRow(r, i + 1))
      setCsvRawRows(rawRows)
      setCsvRows(parsed)
      setCsvPreview(parsed.map(p => ({
        rowIndex: p.rowIndex,
        title: p.title,
        state: p.region,
        balance: p.unpaidBalance,
        fmv: p.asset.fairMarketValue,
        lien: p.lienPosition === 'JUNIOR' ? '2nd' : '1st',
        warnings: p.warnings,
      })))
    } catch {
      setCsvError('Failed to parse CSV. Ensure the file uses the Aurum bulk import template.')
    }
  }

  const handleBulkImport = async () => {
    if (!csvRawRows) return
    setCsvLoading(true)
    setCsvError(null)
    try {
      const res = await fetch('/api/listings/import/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: csvRawRows }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setCsvError(data.error ?? 'Import failed.'); return }
      setBulkResult(data.data)
      setCsvPreview(null)
      setCsvRows(null)
      setCsvRawRows(null)
      setCsvFile(null)
    } catch { setCsvError('Import failed. Please try again.') }
    finally { setCsvLoading(false) }
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
        <button type="button" style={tabStyle('bulk')} onClick={() => setTab('bulk')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Bulk CSV
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

      {/* ── Bulk CSV tab ── */}
      {tab === 'bulk' && (
        <>
          {/* Template download */}
          <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-400)" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              </svg>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Download the <strong style={{ color: 'var(--text-primary)' }}>CSV Template</strong> then fill in one row per loan
              </span>
            </div>
            <a
              href="/api/listings/import/csv-template"
              download="aurum-bulk-import-template.csv"
              className="btn btn--ghost btn--sm"
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download CSV Template
            </a>
          </div>

          {/* Drop zone */}
          {!csvPreview && !bulkResult && (
            <div
              className="glass-card"
              onDrop={e => { e.preventDefault(); setCsvDragging(false); const f = e.dataTransfer.files[0]; if (f) handleCsvFile(f) }}
              onDragOver={e => { e.preventDefault(); setCsvDragging(true) }}
              onDragLeave={() => setCsvDragging(false)}
              onClick={() => csvInputRef.current?.click()}
              style={{ padding: '60px 40px', textAlign: 'center', cursor: 'pointer', border: csvDragging ? '1.5px solid var(--gold-400)' : csvFile ? '1.5px solid rgba(212,168,70,0.4)' : '1.5px dashed rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', transition: 'border-color 0.2s', background: csvDragging ? 'rgba(212,168,70,0.04)' : undefined, marginBottom: '20px' }}
            >
              <input ref={csvInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f) }} />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={csvFile ? 'var(--gold-400)' : 'var(--text-muted)'} strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              {csvFile ? (
                <div><div style={{ fontWeight: 500, marginBottom: '4px' }}>{csvFile.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to change</div></div>
              ) : (
                <div><div style={{ fontWeight: 500, marginBottom: '6px' }}>Drop your .csv file here</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>or click to browse · max 5 MB · up to 200 rows</div></div>
              )}
            </div>
          )}

          {csvError && <div className="alert alert--error" style={{ marginBottom: '16px' }}>{csvError}</div>}

          {/* Preview table */}
          {csvPreview && csvPreview.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{csvPreview.length}</strong> rows ready to import
                  {csvPreview.filter(r => r.warnings.length > 0).length > 0 && (
                    <span style={{ marginLeft: '8px', color: '#fb923c' }}>
                      · {csvPreview.filter(r => r.warnings.length > 0).length} with warnings
                    </span>
                  )}
                </div>
                <button className="btn btn--ghost btn--sm" onClick={() => { setCsvPreview(null); setCsvRows(null); setCsvRawRows(null); setCsvFile(null) }}>Clear</button>
              </div>

              <div className="glass-card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['#', 'Address / Title', 'State', 'Balance', 'FMV', 'Lien', ''].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 50).map((row, i) => (
                        <tr key={row.rowIndex} style={{ borderBottom: i < csvPreview.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.72rem' }}>{row.rowIndex}</td>
                          <td style={{ padding: '10px 14px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{row.state ?? '—'}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'var(--font-display)', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {row.balance > 0 ? `$${(row.balance / 1000).toFixed(0)}K` : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                            {row.fmv ? `$${(row.fmv / 1000).toFixed(0)}K` : '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '100px', background: row.lien === '2nd' ? 'rgba(251,146,60,0.1)' : 'rgba(59,130,246,0.1)', color: row.lien === '2nd' ? '#fb923c' : '#60a5fa', border: `1px solid ${row.lien === '2nd' ? 'rgba(251,146,60,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                              {row.lien}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {row.warnings.length > 0 && (
                              <span title={row.warnings.join('\n')} style={{ fontSize: '0.65rem', color: '#fb923c', cursor: 'help' }}>⚠ {row.warnings.length}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvPreview.length > 50 && (
                  <div style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                    …and {csvPreview.length - 50} more rows (all will be imported)
                  </div>
                )}
              </div>

              <button className="btn btn--gold" onClick={handleBulkImport} disabled={csvLoading}>
                {csvLoading && <Spinner size={15} color="#0a0a0a" />}
                {csvLoading ? `Importing ${csvPreview.length} listings…` : `Import ${csvPreview.length} Listings`}
              </button>
            </div>
          )}

          {/* Bulk import result */}
          {bulkResult && (
            <div>
              <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '32px', marginBottom: bulkResult.errors.length > 0 ? '20px' : 0 }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Created</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#34d399' }}>{bulkResult.created}</div>
                  </div>
                  {bulkResult.failed > 0 && (
                    <div>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Failed</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f87171' }}>{bulkResult.failed}</div>
                    </div>
                  )}
                </div>
                {bulkResult.errors.length > 0 && (
                  <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f87171', marginBottom: '8px' }}>Errors</div>
                    {bulkResult.errors.map(e => (
                      <div key={e.rowIndex} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Row {e.rowIndex}: {e.error}</div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href="/listings?mine=true" className="btn btn--gold">View My Listings →</Link>
                <button className="btn btn--ghost" onClick={() => { setBulkResult(null); setCsvFile(null) }}>Import More</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
