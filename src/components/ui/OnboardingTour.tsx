'use client'
import { useState, useEffect, useCallback } from 'react'

interface TourStep {
  target: string
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingTourProps {
  steps: TourStep[]
  tourKey: string
  onComplete?: () => void
}

export function OnboardingTour({ steps, tourKey, onComplete }: OnboardingTourProps) {
  const storageKey = `aurum_tour_completed_${tourKey}`

  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem(storageKey)
    if (!completed) {
      setActive(true)
    }
  }, [storageKey])

  const findAndSetRect = useCallback((stepIndex: number) => {
    const step = steps[stepIndex]
    if (!step) return

    // Try the selector as-is, then try each comma-separated part
    let el = document.querySelector<HTMLElement>(step.target)
    if (!el) {
      const parts = step.target.split(',').map((s) => s.trim())
      for (const part of parts) {
        el = document.querySelector<HTMLElement>(part)
        if (el) break
      }
    }

    if (!el) {
      // Target not found — skip to next step
      if (stepIndex < steps.length - 1) {
        setCurrentStep(stepIndex + 1)
      } else {
        completeTour()
      }
      return
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Give scroll a moment to settle before capturing rect
    setTimeout(() => {
      if (el) setTargetRect(el.getBoundingClientRect())
    }, 120)
  }, [steps]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active) {
      findAndSetRect(currentStep)
    }
  }, [active, currentStep, findAndSetRect])

  // Re-read rect on window resize
  useEffect(() => {
    if (!active) return
    const handleResize = () => findAndSetRect(currentStep)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [active, currentStep, findAndSetRect])

  const completeTour = useCallback(() => {
    localStorage.setItem(storageKey, '1')
    setActive(false)
    onComplete?.()
  }, [storageKey, onComplete])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      completeTour()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  const handleSkip = () => {
    completeTour()
  }

  if (!active) return null

  const step = steps[currentStep]
  const PAD = 8

  // Highlight box dimensions (with padding around the target)
  const highlight = targetRect
    ? {
        top: targetRect.top - PAD,
        left: targetRect.left - PAD,
        width: targetRect.width + PAD * 2,
        height: targetRect.height + PAD * 2,
      }
    : null

  // Tooltip positioning
  const TOOLTIP_WIDTH = 300
  const TOOLTIP_GAP = 12

  let tooltipStyle: React.CSSProperties = { position: 'fixed', width: TOOLTIP_WIDTH, zIndex: 1002 }

  if (highlight) {
    switch (step.position) {
      case 'right':
        tooltipStyle = {
          ...tooltipStyle,
          top: highlight.top + highlight.height / 2,
          left: highlight.left + highlight.width + TOOLTIP_GAP,
          transform: 'translateY(-50%)',
        }
        break
      case 'left':
        tooltipStyle = {
          ...tooltipStyle,
          top: highlight.top + highlight.height / 2,
          left: highlight.left - TOOLTIP_WIDTH - TOOLTIP_GAP,
          transform: 'translateY(-50%)',
        }
        break
      case 'bottom':
        tooltipStyle = {
          ...tooltipStyle,
          top: highlight.top + highlight.height + TOOLTIP_GAP,
          left: Math.max(12, highlight.left + highlight.width / 2 - TOOLTIP_WIDTH / 2),
        }
        break
      case 'top':
      default:
        tooltipStyle = {
          ...tooltipStyle,
          top: highlight.top - TOOLTIP_GAP,
          left: Math.max(12, highlight.left + highlight.width / 2 - TOOLTIP_WIDTH / 2),
          transform: 'translateY(-100%)',
        }
        break
    }
  } else {
    // No rect yet — center on screen
    tooltipStyle = {
      ...tooltipStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  return (
    <>
      {/* Full-screen backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      />

      {/* Highlight box with box-shadow cutout effect */}
      {highlight && (
        <div
          style={{
            position: 'fixed',
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            borderRadius: 8,
            border: '2px solid #d4a846',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
            zIndex: 1001,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          ...tooltipStyle,
          background: 'rgba(20,20,20,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '20px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Step counter */}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          {currentStep + 1} of {steps.length}
        </div>

        {/* Title */}
        <div style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.05rem', fontWeight: 400, marginBottom: '8px', color: '#d4a846' }}>
          {step.title}
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #d1d5db)', lineHeight: 1.55, margin: '0 0 16px' }}>
          {step.description}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            style={{
              background: '#d4a846',
              border: 'none',
              color: '#0a0a0a',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {currentStep < steps.length - 1 ? 'Next' : 'Done'}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #6b7280)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              marginLeft: 'auto',
              padding: '6px 4px',
            }}
          >
            Skip tour
          </button>
        </div>
      </div>
    </>
  )
}
