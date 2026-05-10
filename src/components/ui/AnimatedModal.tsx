'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  zIndex?: number
}

export function AnimatedModal({
  open,
  onClose,
  children,
  maxWidth = '520px',
  zIndex = 200,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', inset: 0, zIndex,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
            style={{
              position: 'relative', zIndex: 1,
              width: '90vw', maxWidth,
              maxHeight: '90vh',
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
