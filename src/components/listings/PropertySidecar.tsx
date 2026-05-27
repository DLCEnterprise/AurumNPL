'use client'

import { useState } from 'react'
import { StreetViewPanorama } from './StreetViewPanorama'

type Props = {
  asset: { [key: string]: unknown }
  apiKey?: string
}

function fmtNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

function fmtSqFt(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toLocaleString()} sqft`
}

function fmtBeds(beds: number | null | undefined, baths: number | null | undefined): string {
  if (beds == null && baths == null) return '—'
  return `${beds ?? '?'} bd · ${baths ?? '?'} ba`
}

export function PropertySidecar({ asset, apiKey }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = asset as Record<string, any>
  const [expanded, setExpanded] = useState(false)

  const street = a.propertyStreet as string | null
  const city   = a.propertyCity as string | null
  const state  = a.propertyState as string | null
  const zip    = a.propertyZip as string | null
  const address = [street, city, state, zip].filter(Boolean).join(', ')

  if (!address && !a.propertyType && !a.yearBuilt) return null

  const rows: Array<{ label: string; value: string }> = [
    a.propertyType  && { label: 'Property Type', value: String(a.propertyType) },
    street          && { label: 'Street',        value: String(street) },
    city            && { label: 'City',          value: String(city) },
    state           && { label: 'State',         value: String(state) },
    zip             && { label: 'Zip',           value: String(zip) },
    a.county        && { label: 'County',        value: String(a.county) },
    a.yearBuilt     && { label: 'Year Built',    value: fmtNumber(a.yearBuilt as number) },
    a.floorSizeSqFt && { label: 'Floor Size',    value: fmtSqFt(a.floorSizeSqFt as number) },
    a.lotSizeSqFt   && { label: 'Lot Size',      value: fmtSqFt(a.lotSizeSqFt as number) },
    (a.bedrooms != null || a.bathrooms != null) && {
      label: 'Bed / Bath',
      value: fmtBeds(a.bedrooms as number, a.bathrooms as number),
    },
    a.occupancyType && { label: 'Occupancy',     value: String(a.occupancyType) },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <>
      <div className="glass-card property-card">
        {/* ── Map / Street View (40% bigger than prior 200×140) ── */}
        <div className="property-card__map">
          {apiKey && address ? (
            <>
              <StreetViewPanorama address={address} apiKey={apiKey} />
              <button
                type="button"
                className="property-card__map-expand"
                onClick={() => setExpanded(true)}
                aria-label="Expand street view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            </>
          ) : (
            <div className="property-card__map-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontSize: '0.78rem' }}>{address || 'Property location unavailable'}</span>
            </div>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="property-card__body">
          <div className="property-card__section-title">Property Details</div>

          {/* Address block */}
          {address && (
            <div className="property-card__address-row">
              {street && (
                <div className="property-card__address-line">{street}</div>
              )}
              {(city || state || zip) && (
                <div className="property-card__address-sub">
                  {[city, state, zip].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Spec rows */}
          <div className="property-card__rows">
            {rows.map(({ label, value }) => (
              <div key={label} className="property-card__row">
                <span className="property-card__row-label">{label}</span>
                <span className="property-card__row-leader" aria-hidden="true" />
                <span className="property-card__row-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded modal map */}
      {expanded && (
        <div className="property-modal" onClick={() => setExpanded(false)}>
          <div className="property-modal__inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="property-modal__close"
              onClick={() => setExpanded(false)}
              aria-label="Close"
            >
              ×
            </button>
            {apiKey && address && (
              <StreetViewPanorama address={address} apiKey={apiKey} />
            )}
          </div>
        </div>
      )}
    </>
  )
}
