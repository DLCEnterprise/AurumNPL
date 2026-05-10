import { describe, it, expect } from 'vitest'
import { formatCurrency, getInitials, timeAgo, generateNonce } from './utils'

describe('formatCurrency', () => {
  it('formats billions', () => {
    expect(formatCurrency(1_500_000_000)).toBe('$1.5B')
    expect(formatCurrency(2_400_000_000)).toBe('$2.4B')
  })

  it('formats millions', () => {
    expect(formatCurrency(48_700_000)).toBe('$48.7M')
    expect(formatCurrency(1_000_000)).toBe('$1.0M')
  })

  it('formats thousands', () => {
    expect(formatCurrency(6_100)).toBe('$6.1K')
    expect(formatCurrency(1_000)).toBe('$1.0K')
  })

  it('formats sub-thousand amounts', () => {
    expect(formatCurrency(500)).toBe('$500')
    expect(formatCurrency(0)).toBe('$0')
  })

  it('handles exact boundary values', () => {
    // 999999 / 1000 = 999.999, toFixed(1) rounds to 1000.0
    expect(formatCurrency(999_999)).toBe('$1000.0K')
    expect(formatCurrency(1_000_000)).toBe('$1.0M')
  })
})

describe('getInitials', () => {
  it('returns two initials for two-word names', () => {
    expect(getInitials('John Smith')).toBe('JS')
    expect(getInitials('Acme Capital')).toBe('AC')
  })

  it('returns one initial for single-word names', () => {
    expect(getInitials('Goldman')).toBe('G')
  })

  it('uppercases initials', () => {
    expect(getInitials('john smith')).toBe('JS')
  })

  it('takes only first two words for longer names', () => {
    expect(getInitials('First Middle Last')).toBe('FM')
  })
})

describe('timeAgo', () => {
  it('returns "just now" for very recent dates', () => {
    expect(timeAgo(new Date(Date.now() - 30_000))).toBe('just now')
  })

  it('returns minutes ago', () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60_000))).toBe('5m ago')
  })

  it('returns hours ago', () => {
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000))).toBe('3h ago')
  })

  it('returns days ago for recent days', () => {
    expect(timeAgo(new Date(Date.now() - 2 * 86400_000))).toBe('2d ago')
  })

  it('returns a month+day string for dates older than a week', () => {
    // Use noon UTC so the date is the same in all timezones
    const result = timeAgo(new Date('2024-06-15T12:00:00.000Z'))
    expect(result).toMatch(/Jun 15/)
  })
})

describe('generateNonce', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateNonce()).toBe('string')
    expect(generateNonce().length).toBeGreaterThan(0)
  })

  it('returns unique values on each call', () => {
    const a = generateNonce()
    const b = generateNonce()
    expect(a).not.toBe(b)
  })
})
