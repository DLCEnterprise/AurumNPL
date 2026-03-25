'use client'

import { useState, useEffect } from 'react'
import {
  calculateYield,
  fmtPct,
  fmtDollar,
  parseDollarInput,
  type Frequency,
  type Direction,
  type YieldInputs,
  type YieldResult,
} from '@/lib/yield-calculator'

// ── Sub-components ────────────────────────────────────────────────────────────

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ label: string; value: T }>
  onChange: (v: T) => void
}) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: value === opt.value ? 'var(--gold-400)' : 'transparent',
            color: value === opt.value ? '#0a0a0a' : 'var(--text-muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers, commas, dots, dollar sign
    const raw = e.target.value.replace(/[^0-9.,]/g, '')
    onChange(raw)
  }

  const display = value
    ? (() => {
        const n = parseDollarInput(value)
        if (n === 0 && value !== '0') return value
        return n.toLocaleString('en-US')
      })()
    : ''

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>$</span>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        placeholder={placeholder ?? '0'}
        className="form-input"
        style={{ paddingLeft: '28px' }}
      />
    </div>
  )
}

function StepRow({
  number,
  label,
  children,
  checked,
}: {
  number: number
  label: string
  children: React.ReactNode
  checked?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
      {/* Number / checkmark */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px',
        background: checked ? 'rgba(212,168,70,0.15)' : 'rgba(255,255,255,0.04)',
        border: checked ? '1px solid rgba(212,168,70,0.3)' : '1px solid var(--border)',
        color: checked ? 'var(--gold-400)' : 'var(--text-muted)',
        fontSize: '0.72rem', fontWeight: 600,
      }}>
        {checked
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          : number
        }
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>{label}</div>
        {children}
      </div>
    </div>
  )
}

// ── Results panel ─────────────────────────────────────────────────────────────

function ResultsPanel({ result, inputs }: { result: YieldResult; inputs: YieldInputs }) {
  if (result.error) {
    return (
      <div className="alert alert--error" style={{ marginTop: '24px' }}>{result.error}</div>
    )
  }

  const freq = inputs.frequency
  const freqLabel = freq === 'monthly' ? 'month' : freq === 'quarterly' ? 'quarter' : freq === 'semiannual' ? '6 months' : 'year'

  const summary = `You ${inputs.initialDirection} ${fmtDollar(inputs.initialAmount)} today, ${inputs.paymentDirection} ${fmtDollar(inputs.paymentAmount)}/${freqLabel} for ${inputs.durationValue} ${inputs.durationUnit}${inputs.terminalAmount > 0 ? `, and ${inputs.terminalDirection} ${fmtDollar(inputs.terminalAmount)} at maturity` : ''}.`

  return (
    <div className="glass-card" style={{ marginTop: '24px', padding: '28px', border: '1px solid rgba(212,168,70,0.15)' }}>
      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Your Return
      </div>

      {/* Hero metric */}
      <div style={{ textAlign: 'center', marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Annualized IRR</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 400, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
          {fmtPct(result.annualizedIRR)}
        </div>
      </div>

      {/* Other metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Return', value: fmtPct(result.totalReturn) },
          { label: 'Cash-on-Cash (Yr 1)', value: fmtPct(result.cashOnCash) },
          { label: 'Net Profit', value: fmtDollar(result.netProfit) },
          { label: 'Total Received', value: fmtDollar(result.totalReceived) },
          { label: 'Total Paid', value: fmtDollar(result.totalPaid) },
          { label: 'Periods', value: String(result.numPeriods) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Summary sentence */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', lineHeight: 1.6 }}>
        {summary}
      </div>
    </div>
  )
}

// ── Prefill type ──────────────────────────────────────────────────────────────

export interface YieldPrefill {
  paymentAmount?: number
  durationMonths?: number
}

// ── Main component ────────────────────────────────────────────────────────────

export function YieldCalculator({
  prefill,
  showSignupCta,
}: {
  prefill?: YieldPrefill
  showSignupCta?: boolean
}) {
  const [initialStr, setInitialStr] = useState('')
  const [initialDir, setInitialDir] = useState<Direction>('pay')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [paymentStr, setPaymentStr] = useState(prefill?.paymentAmount ? String(prefill.paymentAmount) : '')
  const [paymentDir, setPaymentDir] = useState<Direction>('receive')
  const [durationStr, setDurationStr] = useState(prefill?.durationMonths ? String(prefill.durationMonths) : '')
  const [durationUnit, setDurationUnit] = useState<'years' | 'months'>(prefill?.durationMonths ? 'months' : 'years')
  const [terminalStr, setTerminalStr] = useState('0')
  const [terminalDir, setTerminalDir] = useState<Direction>('receive')
  const [result, setResult] = useState<YieldResult | null>(null)

  // If prefill changes (e.g. parent updates), re-apply
  useEffect(() => {
    if (prefill?.paymentAmount) setPaymentStr(String(prefill.paymentAmount))
    if (prefill?.durationMonths) { setDurationStr(String(prefill.durationMonths)); setDurationUnit('months') }
  }, [prefill])

  const handleCalculate = () => {
    const inputs: YieldInputs = {
      initialAmount: parseDollarInput(initialStr),
      initialDirection: initialDir,
      frequency,
      paymentAmount: parseDollarInput(paymentStr),
      paymentDirection: paymentDir,
      durationValue: parseFloat(durationStr) || 0,
      durationUnit,
      terminalAmount: parseDollarInput(terminalStr),
      terminalDirection: terminalDir,
    }
    setResult(calculateYield(inputs))
  }

  const currentInputs: YieldInputs = {
    initialAmount: parseDollarInput(initialStr),
    initialDirection: initialDir,
    frequency,
    paymentAmount: parseDollarInput(paymentStr),
    paymentDirection: paymentDir,
    durationValue: parseFloat(durationStr) || 0,
    durationUnit,
    terminalAmount: parseDollarInput(terminalStr),
    terminalDirection: terminalDir,
  }

  const isChecked = (step: number) => {
    switch (step) {
      case 1: return parseDollarInput(initialStr) > 0
      case 2: return true
      case 3: return parseDollarInput(paymentStr) > 0
      case 4: return parseFloat(durationStr) > 0
      case 5: return true
      default: return false
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Step 1 */}
        <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          <StepRow number={1} label="How much will you pay/receive today?" checked={isChecked(1)}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <CurrencyInput value={initialStr} onChange={setInitialStr} placeholder="Purchase price" />
              <SegmentedControl<Direction>
                value={initialDir}
                options={[{ label: 'Pay', value: 'pay' }, { label: 'Receive', value: 'receive' }]}
                onChange={setInitialDir}
              />
            </div>
          </StepRow>
        </div>

        {/* Step 2 */}
        <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          <StepRow number={2} label="You will pay/receive payments:" checked={isChecked(2)}>
            <SegmentedControl<Frequency>
              value={frequency}
              options={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Quarterly', value: 'quarterly' },
                { label: '2 / Year', value: 'semiannual' },
                { label: 'Yearly', value: 'annual' },
              ]}
              onChange={setFrequency}
            />
          </StepRow>
        </div>

        {/* Step 3 */}
        <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          <StepRow number={3} label="How much is each payment?" checked={isChecked(3)}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <CurrencyInput value={paymentStr} onChange={setPaymentStr} placeholder="Monthly payment" />
              <SegmentedControl<Direction>
                value={paymentDir}
                options={[{ label: 'Pay', value: 'pay' }, { label: 'Receive', value: 'receive' }]}
                onChange={setPaymentDir}
              />
            </div>
            {prefill?.paymentAmount && (
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Pre-filled from listing. Adjust to model your scenario.
              </div>
            )}
          </StepRow>
        </div>

        {/* Step 4 */}
        <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          <StepRow number={4} label="How long will you make or receive payments?" checked={isChecked(4)}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                min="0"
                value={durationStr}
                onChange={(e) => setDurationStr(e.target.value)}
                className="form-input"
                style={{ width: '100px' }}
                placeholder="30"
              />
              <SegmentedControl<'years' | 'months'>
                value={durationUnit}
                options={[{ label: 'Years', value: 'years' }, { label: 'Months', value: 'months' }]}
                onChange={setDurationUnit}
              />
            </div>
          </StepRow>
        </div>

        {/* Step 5 */}
        <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '28px' }}>
          <StepRow number={5} label="How much will you pay or receive at the end?" checked={isChecked(5)}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <CurrencyInput value={terminalStr} onChange={setTerminalStr} placeholder="0" />
              <SegmentedControl<Direction>
                value={terminalDir}
                options={[{ label: 'Pay', value: 'pay' }, { label: 'Receive', value: 'receive' }]}
                onChange={setTerminalDir}
              />
            </div>
          </StepRow>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleCalculate}
        style={{
          width: '100%',
          padding: '18px',
          fontSize: '1.1rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '0.04em',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          background: 'var(--gold-gradient)',
          color: '#0a0a0a',
          transition: 'opacity 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
      >
        What is my Return?
      </button>

      {/* Results */}
      {result && <ResultsPanel result={result} inputs={currentInputs} />}

      {/* Sign-up CTA for public page */}
      {showSignupCta && result && !result.error && (
        <div className="glass-card" style={{ marginTop: '16px', padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
            Want to find assets with this return profile?
          </p>
          <a href="/signup" className="btn btn--gold btn--sm">
            Sign up for AURUM →
          </a>
        </div>
      )}
    </div>
  )
}
