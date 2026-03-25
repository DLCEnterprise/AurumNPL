/**
 * Yield / IRR Calculator
 *
 * All calculations run entirely client-side — no API calls needed.
 *
 * IRR solved with Newton-Raphson, max 1000 iterations, tolerance 1e-7.
 */

export type Frequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type Direction = 'pay' | 'receive'

export interface YieldInputs {
  initialAmount: number         // absolute value
  initialDirection: Direction   // 'pay' = negative CF at t=0
  frequency: Frequency
  paymentAmount: number         // absolute value per period
  paymentDirection: Direction   // 'receive' = positive periodic CF
  durationValue: number
  durationUnit: 'years' | 'months'
  terminalAmount: number        // absolute value
  terminalDirection: Direction  // 'receive' = positive at final period
}

export interface YieldResult {
  annualizedIRR: number | null     // decimal e.g. 0.147 = 14.7%
  totalReturn: number | null       // decimal e.g. 1.873 = 187.3%
  cashOnCash: number | null        // year-1 income / initial investment
  netProfit: number                // dollars
  totalReceived: number            // dollars
  totalPaid: number                // dollars
  numPeriods: number
  periodicRate: number | null      // the IRR at the payment frequency
  error: string | null
}

// ── Cash flow builder ─────────────────────────────────────────────────────────

function periodsPerYear(freq: Frequency): number {
  switch (freq) {
    case 'monthly':    return 12
    case 'quarterly':  return 4
    case 'semiannual': return 2
    case 'annual':     return 1
  }
}

function buildCashFlows(inputs: YieldInputs): number[] {
  const {
    initialAmount, initialDirection,
    frequency,
    paymentAmount, paymentDirection,
    durationValue, durationUnit,
    terminalAmount, terminalDirection,
  } = inputs

  const ppy = periodsPerYear(frequency)
  const numPeriods = durationUnit === 'years'
    ? Math.round(durationValue * ppy)
    : Math.round(durationValue)

  const cfs: number[] = new Array(numPeriods + 1).fill(0)

  // Period 0 — initial investment
  cfs[0] = initialDirection === 'pay' ? -initialAmount : initialAmount

  // Periods 1..N — periodic payments
  const periodicCF = paymentDirection === 'receive' ? paymentAmount : -paymentAmount
  for (let t = 1; t <= numPeriods; t++) {
    cfs[t] += periodicCF
  }

  // Final period — terminal value
  if (terminalAmount !== 0) {
    const termCF = terminalDirection === 'receive' ? terminalAmount : -terminalAmount
    cfs[numPeriods] += termCF
  }

  return cfs
}

// ── NPV ───────────────────────────────────────────────────────────────────────

function npv(cfs: number[], rate: number): number {
  let result = 0
  for (let t = 0; t < cfs.length; t++) {
    result += cfs[t] / Math.pow(1 + rate, t)
  }
  return result
}

function npvDerivative(cfs: number[], rate: number): number {
  let result = 0
  for (let t = 1; t < cfs.length; t++) {
    result -= (t * cfs[t]) / Math.pow(1 + rate, t + 1)
  }
  return result
}

// ── IRR (Newton-Raphson) ──────────────────────────────────────────────────────

function computeIRR(cfs: number[]): number | null {
  // Guard: need at least one sign change
  const hasPositive = cfs.some((c) => c > 0)
  const hasNegative = cfs.some((c) => c < 0)
  if (!hasPositive || !hasNegative) return null

  const MAX_ITER = 1000
  const TOL = 1e-7

  // Try multiple initial guesses to avoid local minima
  const guesses = [0.1, 0.05, 0.2, 0.3, -0.05, 0.5]

  for (const guess of guesses) {
    let r = guess
    for (let i = 0; i < MAX_ITER; i++) {
      const f = npv(cfs, r)
      const df = npvDerivative(cfs, r)
      if (Math.abs(df) < 1e-14) break
      const rNew = r - f / df
      if (Math.abs(rNew - r) < TOL) {
        // Verify it's actually close to zero
        if (Math.abs(npv(cfs, rNew)) < 1e-4) {
          return rNew
        }
        break
      }
      r = rNew
      if (r <= -1) { r = -0.999; }
    }
  }

  return null
}

// ── Annualise ─────────────────────────────────────────────────────────────────

function annualise(periodicRate: number, freq: Frequency): number {
  const ppy = periodsPerYear(freq)
  return Math.pow(1 + periodicRate, ppy) - 1
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculateYield(inputs: YieldInputs): YieldResult {
  const { initialAmount, initialDirection, frequency, paymentAmount, paymentDirection, terminalAmount, terminalDirection } = inputs

  if (initialAmount <= 0) {
    return { annualizedIRR: null, totalReturn: null, cashOnCash: null, netProfit: 0, totalReceived: 0, totalPaid: 0, numPeriods: 0, periodicRate: null, error: 'Initial amount must be greater than zero.' }
  }

  const cfs = buildCashFlows(inputs)
  const numPeriods = cfs.length - 1

  if (numPeriods <= 0) {
    return { annualizedIRR: null, totalReturn: null, cashOnCash: null, netProfit: 0, totalReceived: 0, totalPaid: initialAmount, numPeriods: 0, periodicRate: null, error: 'Duration must be greater than zero.' }
  }

  const periodicRate = computeIRR(cfs)
  const annualizedIRR = periodicRate !== null ? annualise(periodicRate, frequency) : null

  // Total received / paid
  const ppy = periodsPerYear(frequency)
  const totalPeriodicReceived = paymentDirection === 'receive' ? paymentAmount * numPeriods : 0
  const totalPeriodicPaid     = paymentDirection === 'pay'     ? paymentAmount * numPeriods : 0
  const terminalReceived      = terminalDirection === 'receive' ? terminalAmount : 0
  const terminalPaid          = terminalDirection === 'pay'     ? terminalAmount : 0
  const initialPaid           = initialDirection === 'pay'      ? initialAmount : 0
  const initialReceived       = initialDirection === 'receive'  ? initialAmount : 0

  const totalReceived = totalPeriodicReceived + terminalReceived + initialReceived
  const totalPaid     = totalPeriodicPaid + terminalPaid + initialPaid

  const netProfit    = totalReceived - totalPaid
  const totalReturn  = totalPaid > 0 ? netProfit / totalPaid : null

  // Cash-on-cash: year-1 income / initial investment
  const year1Periods = Math.min(numPeriods, ppy)
  const year1Income = paymentDirection === 'receive' ? paymentAmount * year1Periods : 0
  const cashOnCash = initialPaid > 0 && year1Income > 0 ? year1Income / initialPaid : null

  return {
    annualizedIRR,
    totalReturn,
    cashOnCash,
    netProfit,
    totalReceived,
    totalPaid,
    numPeriods,
    periodicRate,
    error: null,
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function fmtPct(n: number | null, decimals = 1): string {
  if (n === null) return 'N/A'
  return `${(n * 100).toFixed(decimals)}%`
}

export function fmtDollar(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function parseDollarInput(s: string): number {
  const cleaned = s.replace(/[$,\s]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}
