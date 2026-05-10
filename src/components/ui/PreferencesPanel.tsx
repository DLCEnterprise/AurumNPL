'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePreferences, type AccentTheme, type Density, type NavLayout, type ListingsView, type NumberFmt } from '@/lib/preferences'

interface Props {
  open: boolean
  onClose: () => void
}

const THEMES: { id: AccentTheme; name: string; color: string }[] = [
  { id: 'gold',     name: 'Gold',     color: '#d4a846' },
  { id: 'sapphire', name: 'Sapphire', color: '#3b82f6' },
  { id: 'obsidian', name: 'Obsidian', color: '#d4d4d8' },
  { id: 'emerald',  name: 'Emerald',  color: '#34d399' },
]

export function PreferencesPanel({ open, onClose }: Props) {
  const prefs = usePreferences()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 400,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 401,
              width: '320px',
              background: 'var(--surface-panel)',
              borderLeft: '1px solid var(--border-default)',
              display: 'flex', flexDirection: 'column',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400, margin: 0 }}>
                  Preferences
                </h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Changes apply instantly
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', display: 'flex' }}
                aria-label="Close preferences"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>

              {/* Navigation layout */}
              <div className="prefs-section">
                <p className="prefs-section__label">Navigation</p>
                <div className="prefs-segment">
                  {(['sidebar', 'topbar'] as NavLayout[]).map((v) => (
                    <button
                      key={v}
                      className={`prefs-segment__btn${prefs.navLayout === v ? ' active' : ''}`}
                      onClick={() => prefs.set('navLayout', v)}
                    >
                      {v === 'sidebar' ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="6" height="18" rx="1"/><rect x="11" y="3" width="10" height="18" rx="1"/>
                          </svg>
                          Left Bar
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="11" width="18" height="10" rx="1"/>
                          </svg>
                          Top Bar
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent theme */}
              <div className="prefs-section">
                <p className="prefs-section__label">Accent Theme</p>
                <div className="prefs-swatches">
                  {THEMES.map((t) => (
                    <motion.div
                      key={t.id}
                      className={`prefs-swatch${prefs.accentTheme === t.id ? ' active' : ''}`}
                      onClick={() => prefs.set('accentTheme', t.id)}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div
                        className="prefs-swatch__dot"
                        style={{ background: t.color }}
                      />
                      <span className="prefs-swatch__name">{t.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Density */}
              <div className="prefs-section">
                <p className="prefs-section__label">Density</p>
                <div className="prefs-segment">
                  {(['compact', 'standard', 'spacious'] as Density[]).map((v) => (
                    <button
                      key={v}
                      className={`prefs-segment__btn${prefs.density === v ? ' active' : ''}`}
                      onClick={() => prefs.set('density', v)}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listings view */}
              <div className="prefs-section">
                <p className="prefs-section__label">Listings View</p>
                <div className="prefs-segment">
                  {(['grid', 'list'] as ListingsView[]).map((v) => (
                    <button
                      key={v}
                      className={`prefs-segment__btn${prefs.listingsView === v ? ' active' : ''}`}
                      onClick={() => prefs.set('listingsView', v)}
                    >
                      {v === 'grid' ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                          </svg>
                          Grid
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                          </svg>
                          List
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number format */}
              <div className="prefs-section">
                <p className="prefs-section__label">Number Format</p>
                <div className="prefs-segment">
                  {(['abbreviated', 'full'] as NumberFmt[]).map((v) => (
                    <button
                      key={v}
                      className={`prefs-segment__btn${prefs.numberFormat === v ? ' active' : ''}`}
                      onClick={() => prefs.set('numberFormat', v)}
                    >
                      {v === 'abbreviated' ? '$1.2M' : '$1,200,000'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}>
              <button
                onClick={() => {
                  prefs.set('navLayout',    'sidebar')
                  prefs.set('accentTheme',  'gold')
                  prefs.set('density',      'standard')
                  prefs.set('listingsView', 'grid')
                  prefs.set('numberFormat', 'abbreviated')
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}
              >
                Reset to defaults
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
