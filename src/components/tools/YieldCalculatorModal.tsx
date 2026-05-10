'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AnimatedModal } from '@/components/ui/AnimatedModal'
import { YieldCalculator, type YieldPrefill } from './YieldCalculator'

interface Props {
  prefill?: YieldPrefill
}

export function YieldCalculatorModal({ prefill }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        className="btn btn--ghost"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        Calculate Yield
      </motion.button>

      <AnimatedModal open={open} onClose={() => setOpen(false)} maxWidth="580px" zIndex={300}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, margin: 0, lineHeight: 1.2 }}>
              Yield Calculator
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Calculate IRR, total yield, and cash-on-cash for this investment.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
          <YieldCalculator prefill={prefill} />
        </div>
      </AnimatedModal>
    </>
  )
}
