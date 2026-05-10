'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AssetType, ListingStatus, LienPosition } from '@prisma/client'
import { usePreferences } from '@/lib/preferences'

interface SavedSearch {
  id: string
  name: string
  filters: Record<string, unknown>
}

interface Props {
  initialAssetType?: AssetType
  initialStatus?: ListingStatus
  initialState?: string
  initialUpbMin?: number
  initialUpbMax?: number
  initialQ?: string
  initialSortBy?: string
  initialDelinquencyMin?: number
  initialDelinquencyMax?: number
  initialLienPosition?: LienPosition
  mine?: boolean
}

const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' }, { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' }, { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' }, { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' }, { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' }, { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' }, { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
]

const UPB_RANGES = [
  { label: 'Any UPB',       min: undefined,  max: undefined  },
  { label: '$1 – $50K',    min: 1,          max: 50_000     },
  { label: '$50K – $100K', min: 50_000,     max: 100_000    },
  { label: '$100K – $500K',min: 100_000,    max: 500_000    },
  { label: '$500K+',       min: 500_000,    max: undefined  },
]

export function ListingsFilters({
  initialAssetType,
  initialStatus,
  initialState,
  initialUpbMin,
  initialUpbMax,
  initialQ = '',
  initialSortBy = 'newest',
  initialDelinquencyMin,
  initialDelinquencyMax,
  initialLienPosition,
  mine,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { listingsView, set: setPrefs } = usePreferences()

  // ── Local state ────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState(initialQ)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [delinquencyMin, setDelinquencyMin] = useState(initialDelinquencyMin?.toString() ?? '')
  const [delinquencyMax, setDelinquencyMax] = useState(initialDelinquencyMax?.toString() ?? '')
  const [lienPosition, setLienPosition] = useState<LienPosition | ''>(initialLienPosition ?? '')

  // Save search modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  // Saved searches dropdown
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── URL push helper ────────────────────────────────────────────────────────
  const push = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      if (mine) params.set('mine', 'true')

      const current: Record<string, string | undefined> = {
        assetType:      initialAssetType,
        status:         initialStatus,
        state:          initialState,
        upbMin:         initialUpbMin?.toString(),
        upbMax:         initialUpbMax?.toString(),
        q:              searchText || undefined,
        sortBy:         initialSortBy !== 'newest' ? initialSortBy : undefined,
        delinquencyMin: delinquencyMin || undefined,
        delinquencyMax: delinquencyMax || undefined,
        lienPosition:   lienPosition || undefined,
        ...updates,
      }

      for (const [k, v] of Object.entries(current)) {
        if (v) params.set(k, v)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [
      router, pathname, mine,
      initialAssetType, initialStatus, initialState, initialUpbMin, initialUpbMax,
      initialSortBy, searchText, delinquencyMin, delinquencyMax, lienPosition,
    ]
  )

  // ── Debounced full-text search ─────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (mine) params.set('mine', 'true')
      if (initialAssetType) params.set('assetType', initialAssetType)
      if (initialStatus) params.set('status', initialStatus)
      if (initialState) params.set('state', initialState)
      if (initialUpbMin !== undefined) params.set('upbMin', String(initialUpbMin))
      if (initialUpbMax !== undefined) params.set('upbMax', String(initialUpbMax))
      if (initialSortBy && initialSortBy !== 'newest') params.set('sortBy', initialSortBy)
      if (delinquencyMin) params.set('delinquencyMin', delinquencyMin)
      if (delinquencyMax) params.set('delinquencyMax', delinquencyMax)
      if (lienPosition) params.set('lienPosition', lienPosition)
      if (searchText) params.set('q', searchText)
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // We intentionally only react to searchText changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  const upbRangeValue = UPB_RANGES.findIndex(
    (r) => r.min === initialUpbMin && r.max === initialUpbMax
  )

  // ── Saved searches ─────────────────────────────────────────────────────────
  async function fetchSavedSearches() {
    setLoadingSaved(true)
    try {
      const res = await fetch('/api/saved-searches')
      const json = await res.json()
      if (json.success) setSavedSearches(json.data)
    } finally {
      setLoadingSaved(false)
    }
  }

  function toggleSavedSearches() {
    if (!savedSearchesOpen) fetchSavedSearches()
    setSavedSearchesOpen((v) => !v)
  }

  function applySavedSearch(filters: Record<string, unknown>) {
    const params = new URLSearchParams()
    if (mine) params.set('mine', 'true')
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setSavedSearchesOpen(false)
  }

  async function deleteSavedSearch(id: string) {
    await fetch(`/api/saved-searches?id=${id}`, { method: 'DELETE' })
    setSavedSearches((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleSaveSearch() {
    if (!saveName.trim()) return
    setSaving(true)
    try {
      // Collect current filters from URL
      const filters: Record<string, string> = {}
      if (searchText) filters.q = searchText
      if (initialAssetType) filters.assetType = initialAssetType
      if (initialStatus) filters.status = initialStatus
      if (initialState) filters.state = initialState
      if (initialUpbMin !== undefined) filters.upbMin = String(initialUpbMin)
      if (initialUpbMax !== undefined) filters.upbMax = String(initialUpbMax)
      if (initialSortBy && initialSortBy !== 'newest') filters.sortBy = initialSortBy
      if (delinquencyMin) filters.delinquencyMin = delinquencyMin
      if (delinquencyMax) filters.delinquencyMax = delinquencyMax
      if (lienPosition) filters.lienPosition = lienPosition

      await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName.trim(), filters }),
      })
      setSaveModalOpen(false)
      setSaveName('')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Search bar */}
      <div
        className="glass-card"
        style={{ padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search listings by title, location, description..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
          }}
        />
        {searchText && (
          <button
            onClick={() => setSearchText('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px', fontSize: '1rem' }}
          >
            ×
          </button>
        )}
      </div>

      {/* Main filter bar */}
      <div className="filter-bar glass-card" style={{ marginBottom: '8px' }}>
        <div className="filter-bar__group">
          <label>Asset Type</label>
          <select
            value={initialAssetType ?? ''}
            onChange={(e) => push({ assetType: e.target.value || undefined })}
          >
            <option value="">All Types</option>
            <option value="RESIDENTIAL">Residential 1–4 Units</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </div>

        <div className="filter-bar__group">
          <label>UPB Range</label>
          <select
            value={upbRangeValue >= 0 ? upbRangeValue : 0}
            onChange={(e) => {
              const range = UPB_RANGES[parseInt(e.target.value)]
              push({
                upbMin: range?.min?.toString(),
                upbMax: range?.max?.toString(),
              })
            }}
          >
            {UPB_RANGES.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-bar__group">
          <label>State</label>
          <select
            value={initialState ?? ''}
            onChange={(e) => push({ state: e.target.value || undefined })}
          >
            <option value="">All States</option>
            {US_STATES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-bar__group">
          <label>Status</label>
          <select
            value={initialStatus ?? ''}
            onChange={(e) => push({ status: e.target.value || undefined })}
          >
            <option value="">Active</option>
            <option value="ACTIVE">Active</option>
            <option value="OFFER_ACCEPTED">Offer Accepted</option>
            <option value="DUE_DILIGENCE">Due Diligence</option>
            <option value="CLOSING">Closing</option>
            {mine && <option value="DRAFT">Draft</option>}
            {mine && <option value="SOLD">Sold</option>}
            {mine && <option value="ARCHIVED">Archived</option>}
          </select>
        </div>

        <div className="filter-bar__group">
          <label>Sort by</label>
          <select
            value={initialSortBy ?? 'newest'}
            onChange={(e) => push({ sortBy: e.target.value === 'newest' ? undefined : e.target.value })}
          >
            <option value="newest">Newest First</option>
            <option value="upbDesc">UPB: High to Low</option>
            <option value="upbAsc">UPB: Low to High</option>
            <option value="delinquencyDesc">Most Delinquent</option>
            <option value="delinquencyAsc">Least Delinquent</option>
            <option value="firstMortgage">First Mortgage</option>
            <option value="secondMortgage">Second Mortgage</option>
          </select>
        </div>

        <button
          className="btn btn--ghost btn--sm"
          onClick={() => router.push(mine ? '/listings?mine=true' : '/listings')}
        >
          Clear
        </button>

        {/* View toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
          {(['grid', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPrefs('listingsView', v)}
              title={v === 'grid' ? 'Grid view' : 'List view'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '5px 8px',
                borderRadius: 'calc(var(--radius-sm) - 1px)',
                background: listingsView === v ? 'var(--surface-raised)' : 'none',
                border: 'none', cursor: 'pointer',
                color: listingsView === v ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s',
                boxShadow: listingsView === v ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {v === 'grid' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {(() => {
        const chips: { label: string; onRemove: () => void }[] = []
        if (initialQ) chips.push({ label: `"${initialQ}"`, onRemove: () => { setSearchText(''); push({ q: undefined }) } })
        if (initialAssetType) chips.push({ label: initialAssetType === 'RESIDENTIAL' ? 'Residential' : 'Commercial', onRemove: () => push({ assetType: undefined }) })
        if (initialStatus) chips.push({ label: initialStatus.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), onRemove: () => push({ status: undefined }) })
        if (initialState) chips.push({ label: US_STATES.find(s => s.value === initialState)?.label ?? initialState, onRemove: () => push({ state: undefined }) })
        if (initialUpbMin !== undefined || initialUpbMax !== undefined) {
          const rangeLabel = UPB_RANGES.find(r => r.min === initialUpbMin && r.max === initialUpbMax)?.label ?? 'Custom UPB'
          chips.push({ label: rangeLabel, onRemove: () => push({ upbMin: undefined, upbMax: undefined }) })
        }
        if (initialSortBy && initialSortBy !== 'newest') {
          const sortLabels: Record<string, string> = {
            upbDesc: 'UPB: High–Low', upbAsc: 'UPB: Low–High',
            delinquencyDesc: 'Most Delinquent', delinquencyAsc: 'Least Delinquent',
            firstMortgage: 'First Mortgage', secondMortgage: 'Second Mortgage',
          }
          chips.push({ label: sortLabels[initialSortBy] ?? initialSortBy, onRemove: () => push({ sortBy: undefined }) })
        }
        if (initialDelinquencyMin !== undefined || initialDelinquencyMax !== undefined) {
          const dMin = initialDelinquencyMin ?? '0'
          const dMax = initialDelinquencyMax ?? '∞'
          chips.push({ label: `Delinquency: ${dMin}–${dMax}mo`, onRemove: () => push({ delinquencyMin: undefined, delinquencyMax: undefined }) })
        }
        if (initialLienPosition) chips.push({ label: initialLienPosition === 'SENIOR' ? 'First Lien' : 'Second Lien', onRemove: () => push({ lienPosition: undefined }) })

        if (chips.length === 0) return null
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {chips.map((chip) => (
              <span
                key={chip.label}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '3px 10px 3px 12px',
                  borderRadius: '100px',
                  background: 'rgba(212,168,70,0.1)',
                  border: '1px solid rgba(212,168,70,0.25)',
                  color: 'var(--gold-300)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {chip.label}
                <button
                  onClick={chip.onRemove}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(212,168,70,0.6)', fontSize: '1rem',
                    lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center',
                  }}
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )
      })()}

      {/* Advanced filters toggle + action buttons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: advancedOpen ? '8px' : '0' }}>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          {advancedOpen ? '▴ Advanced Filters' : 'Advanced Filters ▾'}
        </button>

        {/* Save Search button */}
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setSaveModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
          </svg>
          Save Search
        </button>

        {/* Saved Searches dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={toggleSavedSearches}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18"/>
            </svg>
            Saved Searches
          </button>

          {savedSearchesOpen && (
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: '240px',
                zIndex: 50,
                padding: '8px 0',
                border: '1px solid rgba(212,168,70,0.2)',
              }}
            >
              {loadingSaved ? (
                <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</div>
              ) : savedSearches.length === 0 ? (
                <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No saved searches yet.</div>
              ) : (
                savedSearches.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,168,70,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      style={{ fontSize: '0.85rem', flex: 1 }}
                      onClick={() => applySavedSearch(s.filters)}
                    >
                      {s.name}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSavedSearch(s.id) }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: '1rem',
                        lineHeight: 1,
                        padding: '0 2px',
                        flexShrink: 0,
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced filters panel */}
      {advancedOpen && (
        <div
          className="glass-card"
          style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}
        >
          {/* Delinquency range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Delinquency (months)
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={delinquencyMin}
                onChange={(e) => setDelinquencyMin(e.target.value)}
                onBlur={() => push({ delinquencyMin: delinquencyMin || undefined, delinquencyMax: delinquencyMax || undefined })}
                style={{ width: '80px' }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={delinquencyMax}
                onChange={(e) => setDelinquencyMax(e.target.value)}
                onBlur={() => push({ delinquencyMin: delinquencyMin || undefined, delinquencyMax: delinquencyMax || undefined })}
                style={{ width: '80px' }}
              />
            </div>
          </div>

          {/* Lien Position */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lien Position
            </label>
            <select
              value={lienPosition}
              onChange={(e) => {
                const val = e.target.value as LienPosition | ''
                setLienPosition(val)
                push({ lienPosition: val || undefined })
              }}
            >
              <option value="">All</option>
              <option value="SENIOR">First Mortgage</option>
              <option value="JUNIOR">Second Mortgage</option>
            </select>
          </div>

          {/* Loan Performance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Loan Performance
            </label>
            <select
              value={''}
              onChange={(e) => push({ performanceStatus: e.target.value || undefined })}
            >
              <option value="">All</option>
              <option value="PERFORMING">Performing / Mod</option>
              <option value="SUB_PERFORMING">Sub-Performing</option>
              <option value="BK_PERFORMING">BK Performing</option>
              <option value="NON_PERFORMING">Non-Performing</option>
            </select>
          </div>
        </div>
      )}

      {/* Save Search inline modal */}
      {saveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSaveModalOpen(false) }}
        >
          <div
            className="glass-card"
            style={{ padding: '24px 28px', width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.1rem' }}>
              Save Search
            </h3>
            <input
              type="text"
              placeholder="Search name…"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSearch() }}
              autoFocus
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => { setSaveModalOpen(false); setSaveName('') }}
              >
                Cancel
              </button>
              <button
                className="btn btn--gold btn--sm"
                onClick={handleSaveSearch}
                disabled={saving || !saveName.trim()}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
