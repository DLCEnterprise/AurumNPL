'use client'

import { useState } from 'react'

interface ExportButtonProps {
  type: 'listings' | 'bids' | 'analytics'
  label?: string
}

export function ExportButton({ type, label = 'Export CSV' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(`/api/export?type=${type}&format=csv`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn btn--ghost btn--sm"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.6 : 1 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {loading ? 'Exporting…' : label}
    </button>
  )
}
