'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { AssetType, ListingStatus } from '@prisma/client'

interface Props {
  initialAssetType?: AssetType
  initialStatus?: ListingStatus
  initialRegion?: string
  initialUpbMin?: number
  initialUpbMax?: number
  mine?: boolean
}

const UPB_RANGES = [
  { label: 'Any', min: undefined, max: undefined },
  { label: '$0 – $5M', min: 0, max: 5_000_000 },
  { label: '$5M – $25M', min: 5_000_000, max: 25_000_000 },
  { label: '$25M – $100M', min: 25_000_000, max: 100_000_000 },
  { label: '$100M+', min: 100_000_000, max: undefined },
]

export function ListingsFilters({
  initialAssetType,
  initialStatus,
  initialRegion,
  initialUpbMin,
  initialUpbMax,
  mine,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const push = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      if (mine) params.set('mine', 'true')

      const current: Record<string, string | undefined> = {
        assetType: initialAssetType,
        status: initialStatus,
        region: initialRegion,
        upbMin: initialUpbMin?.toString(),
        upbMax: initialUpbMax?.toString(),
        ...updates,
      }

      for (const [k, v] of Object.entries(current)) {
        if (v) params.set(k, v)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, mine, initialAssetType, initialStatus, initialRegion, initialUpbMin, initialUpbMax]
  )

  const upbRangeValue = UPB_RANGES.findIndex(
    (r) => r.min === initialUpbMin && r.max === initialUpbMax
  )

  return (
    <div className="filter-bar glass-card" style={{ marginBottom: '28px' }}>
      <div className="filter-bar__group">
        <label>Asset Type</label>
        <select
          value={initialAssetType ?? ''}
          onChange={(e) => push({ assetType: e.target.value || undefined })}
        >
          <option value="">All Types</option>
          <option value="RESIDENTIAL">Residential</option>
          <option value="COMMERCIAL">Commercial</option>
          <option value="CONSUMER">Consumer</option>
          <option value="MIXED">Mixed</option>
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
        <label>Region</label>
        <select
          value={initialRegion ?? ''}
          onChange={(e) => push({ region: e.target.value || undefined })}
        >
          <option value="">All Regions</option>
          <option value="Northeast">Northeast</option>
          <option value="Southeast">Southeast</option>
          <option value="Midwest">Midwest</option>
          <option value="West">West</option>
          <option value="Southwest">Southwest</option>
          <option value="Nationwide">Nationwide</option>
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
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="PENDING">Pending</option>
          {mine && <option value="DRAFT">Draft</option>}
          {mine && <option value="SOLD">Sold</option>}
        </select>
      </div>

      <button
        className="btn btn--ghost btn--sm"
        onClick={() => router.push(mine ? '/listings?mine=true' : '/listings')}
      >
        Clear
      </button>
    </div>
  )
}
