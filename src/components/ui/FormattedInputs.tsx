'use client'

import { useState, useRef } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(raw: string): string {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

function formatPercent(raw: string): string {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return ''
  // Trim trailing zeros after decimal but keep at least the entered precision
  const str = num.toString()
  return `${str}%`
}

function stripNonNumeric(val: string): string {
  // Allow digits and a single decimal point
  const stripped = val.replace(/[^0-9.]/g, '')
  const parts = stripped.split('.')
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('')
  return stripped
}

// ── CurrencyInput ─────────────────────────────────────────────────────────────

interface FormattedInputProps {
  value: string
  onValueChange: (raw: string) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

export function CurrencyInput({
  value,
  onValueChange,
  placeholder,
  className = 'form-input',
  id,
  disabled,
}: FormattedInputProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = focused ? value : (value ? formatCurrency(value) : '')

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      className={className}
      disabled={disabled}
      placeholder={focused ? '' : (placeholder ?? '$0.00')}
      value={displayValue}
      onChange={(e) => onValueChange(stripNonNumeric(e.target.value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

// ── PercentInput ──────────────────────────────────────────────────────────────

export function PercentInput({
  value,
  onValueChange,
  placeholder,
  className = 'form-input',
  id,
  disabled,
}: FormattedInputProps) {
  const [focused, setFocused] = useState(false)

  const displayValue = focused ? value : (value ? formatPercent(value) : '')

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={className}
      disabled={disabled}
      placeholder={focused ? '' : (placeholder ?? '0.00%')}
      value={displayValue}
      onChange={(e) => onValueChange(stripNonNumeric(e.target.value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}
