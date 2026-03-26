'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type ChartPoint = {
  date: string
  label: string
  views: number
  bids: number
  messages: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'rgba(9,9,11,0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '0.82rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: '#d4a846', fontWeight: 500 }}>
          {p.value}
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div
      style={{
        height: '200px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function DashboardCharts() {
  const [chartData, setChartData] = useState<ChartPoint[] | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(json => {
        if (json.success) setChartData(json.data)
      })
      .catch(() => setChartData([]))
  }, [])

  const tickFormatter = (value: string, index: number) => {
    // Show every 7th label
    if (index % 7 !== 0) return ''
    return value
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      {/* Chart 1 — Listing Views */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '16px',
          }}
        >
          Listing Views — Last 30 Days
        </h3>
        {chartData === null ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                tickFormatter={tickFormatter}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide={true} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#d4a846"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#d4a846' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 2 — Bid Activity */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '16px',
          }}
        >
          Bid Activity — Last 30 Days
        </h3>
        {chartData === null ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                tickFormatter={tickFormatter}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide={true} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bids" fill="rgba(212,168,70,0.7)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
