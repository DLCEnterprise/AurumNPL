'use client'

import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react'

export type NavLayout   = 'sidebar' | 'topbar'
export type AccentTheme = 'gold' | 'sapphire' | 'obsidian' | 'emerald'
export type Density     = 'compact' | 'standard' | 'spacious'
export type ListingsView = 'grid' | 'list'
export type NumberFmt   = 'abbreviated' | 'full'

export interface Preferences {
  navLayout:    NavLayout
  accentTheme:  AccentTheme
  density:      Density
  listingsView: ListingsView
  numberFormat: NumberFmt
}

interface PreferencesCtx extends Preferences {
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
}

const DEFAULTS: Preferences = {
  navLayout:    'sidebar',
  accentTheme:  'gold',
  density:      'standard',
  listingsView: 'grid',
  numberFormat: 'abbreviated',
}

const STORAGE_KEY = 'aurum-prefs-v1'

function load(): Preferences {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch { return DEFAULTS }
}

function save(prefs: Preferences) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)) } catch { /* noop */ }
}

function applyToDOM(prefs: Preferences) {
  if (typeof document === 'undefined') return
  const h = document.documentElement
  h.dataset.accent  = prefs.accentTheme
  h.dataset.density = prefs.density
  h.dataset.nav     = prefs.navLayout
}

const PreferencesContext = createContext<PreferencesCtx | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs]   = useState<Preferences>(DEFAULTS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loaded = load()
    setPrefs(loaded)
    applyToDOM(loaded)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    save(prefs)
    applyToDOM(prefs)
  }, [prefs, mounted])

  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPrefs(prev => ({ ...prev, [key]: value }))

  return (
    <PreferencesContext.Provider value={{ ...prefs, set }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences(): PreferencesCtx {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be inside PreferencesProvider')
  return ctx
}

// Shared number formatter respecting the user's format preference
export function formatPref(n: number, format: NumberFmt): string {
  if (format === 'full') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(n)
  }
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n).toLocaleString()}`
}
