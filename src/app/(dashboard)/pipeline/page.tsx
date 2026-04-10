'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Spinner } from '@/components/ui/Skeleton'
import type { DealStage, LienPosition, AssetType, ListingStatus } from '@prisma/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineListing {
  id: string
  title: string
  unpaidBalance: number
  lienPosition: LienPosition | null
  loanCount: number
  location: string
  status: ListingStatus
  assetType: AssetType
  seller: { name: string | null; company: string | null }
}

interface PipelineItem {
  id: string
  listingId: string
  stage: DealStage
  notes: string | null
  listing: PipelineListing
}

type PipelineData = Record<DealStage, PipelineItem[]>

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES: { key: DealStage; label: string; borderColor: string; textColor: string }[] = [
  { key: 'REVIEWING',  label: 'Reviewing',  borderColor: 'rgba(161,161,170,0.25)', textColor: '#a1a1aa' },
  { key: 'BIDDING',    label: 'Bidding',    borderColor: 'rgba(96,165,250,0.25)',  textColor: '#60a5fa' },
  { key: 'UNDER_LOI',  label: 'Under LOI',  borderColor: 'rgba(212,168,70,0.35)', textColor: '#d4a846' },
  { key: 'CLOSING',    label: 'Closing',    borderColor: 'rgba(34,197,94,0.25)',  textColor: '#22c55e' },
  { key: 'CLOSED',     label: 'Closed',     borderColor: 'rgba(168,85,247,0.25)', textColor: '#a855f7' },
]

const STAGE_BG: Record<DealStage, string> = {
  REVIEWING: 'rgba(161,161,170,0.06)',
  BIDDING:   'rgba(96,165,250,0.06)',
  UNDER_LOI: 'rgba(212,168,70,0.06)',
  CLOSING:   'rgba(34,197,94,0.06)',
  CLOSED:    'rgba(168,85,247,0.06)',
}

function emptyPipeline(): PipelineData {
  return { REVIEWING: [], BIDDING: [], UNDER_LOI: [], CLOSING: [], CLOSED: [] }
}

// ─── Card component ───────────────────────────────────────────────────────────

function PipelineCard({
  item,
  onDragStart,
  onRemove,
}: {
  item: PipelineItem
  onDragStart: (e: React.DragEvent, itemId: string) => void
  onRemove: (itemId: string) => void
}) {
  const { listing } = item

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        padding: '14px',
        cursor: 'grab',
        transition: 'opacity 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,168,70,0.3)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
        <Link
          href={`/listings/${listing.id}`}
          style={{
            fontWeight: 500,
            fontSize: '0.85rem',
            lineHeight: 1.35,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            flex: 1,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {listing.title}
        </Link>
        <button
          onClick={() => onRemove(item.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--text-muted)',
            flexShrink: 0,
            lineHeight: 1,
          }}
          title="Remove from pipeline"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* UPB */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        fontWeight: 500,
        background: 'var(--gold-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '8px',
      }}>
        {formatCurrency(listing.unpaidBalance)}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {listing.lienPosition && (
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 7px',
            borderRadius: '100px',
            background: listing.lienPosition === 'SENIOR' ? 'rgba(212,168,70,0.12)' : 'rgba(96,165,250,0.12)',
            color: listing.lienPosition === 'SENIOR' ? '#d4a846' : '#60a5fa',
            border: `1px solid ${listing.lienPosition === 'SENIOR' ? 'rgba(212,168,70,0.2)' : 'rgba(96,165,250,0.2)'}`,
          }}>
            {listing.lienPosition === 'SENIOR' ? '1st' : '2nd'}
          </span>
        )}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {listing.seller.company ?? listing.seller.name ?? 'Unknown'}
        </span>
      </div>
    </div>
  )
}

// ─── Column component ─────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  items,
  onDragStart,
  onDrop,
  onRemove,
}: {
  stage: typeof STAGES[number]
  items: PipelineItem[]
  onDragStart: (e: React.DragEvent, itemId: string) => void
  onDrop: (e: React.DragEvent, targetStage: DealStage) => void
  onRemove: (itemId: string) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const totalUPB = items.reduce((sum, i) => sum + i.listing.unpaidBalance, 0)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, stage.key) }}
      style={{
        flex: '0 0 240px',
        display: 'flex',
        flexDirection: 'column',
        background: isDragOver ? STAGE_BG[stage.key] : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isDragOver ? stage.borderColor : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '12px',
        transition: 'background 0.15s, border-color 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Column header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: stage.textColor, letterSpacing: '0.03em' }}>
          {stage.label}
        </span>
        <span style={{
          fontSize: '0.68rem',
          padding: '2px 8px',
          borderRadius: '100px',
          background: `${stage.borderColor}`,
          color: stage.textColor,
        }}>
          {items.length}
        </span>
      </div>

      {/* UPB sub-header */}
      {items.length > 0 && (
        <div style={{ padding: '6px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatCurrency(totalUPB)} total
          </span>
        </div>
      )}

      {/* Cards */}
      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1.5px dashed ${stage.borderColor}`,
            borderRadius: '8px',
            padding: '24px 12px',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            textAlign: 'center',
            minHeight: '80px',
          }}>
            Drop listings here
          </div>
        ) : (
          items.map((item) => (
            <PipelineCard
              key={item.id}
              item={item}
              onDragStart={onDragStart}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const toast = useToast()
  const [pipeline, setPipeline] = useState<PipelineData>(emptyPipeline())
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/deal-pipeline')
      const json = await res.json()
      if (json.success) setPipeline(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggingId(itemId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
  }

  const handleDrop = async (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain') || draggingId
    if (!itemId) return
    setDraggingId(null)

    // Find current stage
    let currentStage: DealStage | null = null
    let foundItem: PipelineItem | null = null
    for (const stage of Object.keys(pipeline) as DealStage[]) {
      const match = pipeline[stage].find((i) => i.id === itemId)
      if (match) { currentStage = stage; foundItem = match; break }
    }
    if (!foundItem || currentStage === targetStage) return

    // Optimistic update
    setPipeline((prev) => {
      const next = { ...prev }
      next[currentStage!] = next[currentStage!].filter((i) => i.id !== itemId)
      next[targetStage] = [{ ...foundItem!, stage: targetStage }, ...next[targetStage]]
      return next
    })

    // API call
    try {
      const res = await fetch('/api/deal-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, stage: targetStage }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error('Could not move item. Please try again.')
      load()
    }
  }

  const handleRemove = async (itemId: string) => {
    // Optimistic remove
    setPipeline((prev) => {
      const next = { ...prev }
      for (const stage of Object.keys(next) as DealStage[]) {
        next[stage] = next[stage].filter((i) => i.id !== itemId)
      }
      return next
    })

    try {
      const res = await fetch(`/api/deal-pipeline?id=${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      toast.error('Could not remove item. Please try again.')
      load()
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const allItems = Object.values(pipeline).flat()
  const totalCount = allItems.length
  const totalUPB = allItems.reduce((sum, i) => sum + i.listing.unpaidBalance, 0)
  const isEmpty = totalCount === 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '6px' }}>
          Deal Pipeline
        </h1>
        {!loading && !isEmpty && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {totalCount} {totalCount === 1 ? 'deal' : 'deals'} &middot; {formatCurrency(totalUPB)} total UPB
          </p>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '60px 0' }}>
          <Spinner size={18} />
          <span>Loading pipeline…</span>
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="5" height="18" rx="1" />
              <rect x="10" y="3" width="5" height="11" rx="1" />
              <rect x="17" y="3" width="5" height="15" rx="1" />
            </svg>
          }
          title="Your pipeline is empty"
          description="Add listings from the marketplace to track your deals."
          actionLabel="Browse Listings"
          actionHref="/listings"
        />
      ) : (
        <>
          {/* Summary bar */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}>
            {STAGES.map((stage) => {
              const stageItems = pipeline[stage.key]
              if (stageItems.length === 0) return null
              const stageUPB = stageItems.reduce((s, i) => s + i.listing.unpaidBalance, 0)
              return (
                <div
                  key={stage.key}
                  style={{
                    background: STAGE_BG[stage.key],
                    border: `1px solid ${stage.borderColor}`,
                    borderRadius: '8px',
                    padding: '8px 14px',
                  }}
                >
                  <div style={{ fontSize: '0.65rem', color: stage.textColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                    {stage.label}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatCurrency(stageUPB)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Kanban board */}
          <div style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '16px',
            alignItems: 'flex-start',
          }}>
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                items={pipeline[stage.key]}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
