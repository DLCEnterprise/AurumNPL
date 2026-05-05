'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/* ── Types ──────────────────────────────────────────────────────────────── */

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  error:   (message: string) => void
  info:    (message: string) => void
  warning: (message: string) => void
}

/* ── Context ────────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

/* ── Provider ───────────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const add = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }])
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    },
    [dismiss]
  )

  // Cleanup on unmount
  useEffect(() => {
    const t = timers.current
    return () => t.forEach((timer) => clearTimeout(timer))
  }, [])

  const value: ToastContextValue = {
    toast:   add,
    success: (m) => add(m, 'success'),
    error:   (m) => add(m, 'error'),
    info:    (m) => add(m, 'info'),
    warning: (m) => add(m, 'warning'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

/* ── Toaster renderer ───────────────────────────────────────────────────── */

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
}

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)',  icon: '#34d399' },
  error:   { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: '#f87171' },
  warning: { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '#fbbf24' },
  info:    { bg: 'rgba(212,168,70,0.08)',  border: 'rgba(212,168,70,0.25)',  icon: '#d4a846' },
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      role="region"
      aria-live="polite"
      className="toaster-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              minWidth: '280px',
              maxWidth: '360px',
              pointerEvents: 'all',
              animation: 'toastIn 0.3s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>
              {ICONS[t.type]}
            </span>
            <span style={{ fontSize: '0.875rem', lineHeight: 1.5, flex: 1, color: 'var(--text-primary)' }}>
              {t.message}
            </span>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'none', border: 'none', padding: '2px',
                color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0,
                lineHeight: 1,
              }}
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
