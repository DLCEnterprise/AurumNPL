'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface PublicStats {
  activeListings: number
  totalUPB: number
  approvedUsers: number
}

export function StatsBar() {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    fetch('/api/public/stats')
      .then((res) => res.json())
      .then((data: PublicStats) => setStats(data))
      .catch(() => {/* silently fail — placeholders remain */})
  }, [])

  const items = [
    {
      value: stats ? stats.activeListings.toLocaleString() : '—',
      label: 'Active Listings',
    },
    {
      value: stats ? formatCurrency(stats.totalUPB) : '—',
      label: 'Total UPB',
    },
    {
      value: stats ? stats.approvedUsers.toLocaleString() + '+' : '—',
      label: 'Registered Institutions',
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0',
        flexWrap: 'wrap',
      }}
    >
      {items.map((item, i) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="hero__stat">
            <span className="hero__stat-value">{item.value}</span>
            <span className="hero__stat-label">{item.label}</span>
          </div>
          {i < items.length - 1 && <div className="hero__stat-divider" />}
        </div>
      ))}
    </div>
  )
}
