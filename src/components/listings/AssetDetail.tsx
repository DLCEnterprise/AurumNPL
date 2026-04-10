'use client'

import { useState } from 'react'
import type { Asset } from '@prisma/client'
import { StreetViewPanorama } from './StreetViewPanorama'

// ── Helpers ───────────────────────────────────────────────────────────────────

type SerializedAsset = Omit<Asset, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${(n * 100).toFixed(2)}%`
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'string') {
    // Try date
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return fmtDate(v)
    return v
  }
  return String(v)
}

// ── Section components ────────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  badge,
  badgeColor,
  defaultOpen = false,
  children,
}: {
  title: string
  badge?: string
  badgeColor?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: '0.65rem', padding: '2px 8px', borderRadius: '100px', fontWeight: 600, letterSpacing: '0.06em',
              background: badgeColor === 'red' ? 'rgba(239,68,68,0.12)' : badgeColor === 'gold' ? 'rgba(212,168,70,0.12)' : 'rgba(52,211,153,0.12)',
              color: badgeColor === 'red' ? '#f87171' : badgeColor === 'gold' ? 'var(--gold-400)' : 'var(--success)',
              border: `1px solid ${badgeColor === 'red' ? 'rgba(239,68,68,0.2)' : badgeColor === 'gold' ? 'rgba(212,168,70,0.2)' : 'rgba(52,211,153,0.2)'}`,
            }}>
              {badge}
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-muted)" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ height: '1px', background: 'var(--border)', marginBottom: '20px' }} />
          {children}
        </div>
      )}
    </div>
  )
}

function MetricGrid({ items }: { items: Array<{ label: string; value: string; highlight?: boolean }> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
      {items.map(({ label, value, highlight }) => (
        <div key={label}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{
            fontWeight: highlight ? 600 : 400,
            fontSize: highlight ? '1.1rem' : '0.9rem',
            ...(highlight ? { background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: 'var(--text-secondary)' }),
          }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── LTV Gauge ─────────────────────────────────────────────────────────────────

function LtvBar({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null) return null
  const pct = Math.min(Math.round(value * 100), 150)
  const color = pct > 100 ? '#f87171' : pct > 80 ? '#fbbf24' : '#34d399'

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AssetDetail({ asset }: { asset: SerializedAsset }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = asset as Record<string, any>

  // Computed metrics
  const firstBal = (a.firstMtg_currentBalance ?? a.firstMtg_modCurrentBalance ?? 0) as number
  const secondBal = (a.secondMtg_currentBalance ?? a.secondMtg_modCurrentBalance ?? 0) as number
  const fmv = (a.fairMarketValue ?? 0) as number
  const totalDebt = firstBal + secondBal
  const equity = fmv > 0 ? fmv - totalDebt : null
  const equityPct = fmv > 0 && equity !== null ? (equity / fmv) * 100 : null

  const monthlyPI = ((a.firstMtg_isModified ? a.firstMtg_modMonthlyPI : null) ?? a.firstMtg_monthlyPI ?? 0) as number
  const monthlyEscrow = ((a.firstMtg_isModified ? a.firstMtg_modMonthlyEscrow : null) ?? a.firstMtg_monthlyEscrow ?? 0) as number
  const monthlyCashFlow = monthlyPI + monthlyEscrow
  const annualDebtService = monthlyCashFlow * 12

  const nextDue = a.firstMtg_nextDueDate as string | null
  const monthsDelinquent = nextDue
    ? Math.max(0, Math.floor((Date.now() - new Date(nextDue).getTime()) / (30 * 24 * 60 * 60 * 1000)))
    : null
  const totalArrears = monthsDelinquent != null ? monthsDelinquent * monthlyPI : null

  const hasSecond = !!(a.secondMtg_currentBalance || a.secondMtg_loanStatus || a.secondMtg_originalAmount)
  const hasBk = !!(a.isInBankruptcy || a.bkFilingDate || a.ch7PetitionDate)
  const hasFirstForeclosure = !!(a.firstMtg_foreclosureDefaultDate || a.firstMtg_foreclosureSaleDate)
  const hasSecondForeclosure = !!(a.secondMtg_foreclosureDefaultDate || a.secondMtg_foreclosureSaleDate)
  const streetViewKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const address = [a.propertyStreet, a.propertyCity, a.propertyState, a.propertyZip].filter(Boolean).join(', ')

  return (
    <div style={{ marginBottom: '12px' }}>

      {/* ── Section 1: Property Overview ──────────────────────── */}
      <CollapsibleSection title="Property Overview" defaultOpen>
        <div style={{ display: 'grid', gridTemplateColumns: fmv > 0 ? '1fr 1fr' : '1fr', gap: '28px', marginBottom: '24px' }}>
          {/* Street view / placeholder */}
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {streetViewKey && address ? (
              <StreetViewPanorama address={address} apiKey={streetViewKey} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px' }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <div style={{ fontSize: '0.75rem' }}>{address || 'Address not available'}</div>
              </div>
            )}
          </div>

          {/* Property metrics */}
          <div>
            {fmv > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Fair Market Value</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {fmtCurrency(fmv)}
                </div>
              </div>
            )}

            <MetricGrid items={[
              { label: 'Property Type', value: fmtVal(a.propertyType) },
              { label: 'Occupancy', value: fmtVal(a.occupancyType) },
              { label: 'County', value: fmtVal(a.county) },
              { label: 'Year Built', value: fmtVal(a.yearBuilt) },
              { label: 'Sq Ft', value: a.floorSizeSqFt ? `${(a.floorSizeSqFt as number).toLocaleString()} sqft` : '—' },
              { label: 'Bedrooms / Baths', value: a.bedrooms != null || a.bathrooms != null ? `${a.bedrooms ?? '?'} bd / ${a.bathrooms ?? '?'} ba` : '—' },
              { label: 'Purchase Date', value: fmtDate(a.homePurchaseDate as string) },
              { label: 'Purchase Price', value: fmtCurrency(a.homePurchasePrice as number) },
              { label: 'State', value: fmtVal(a.propertyState) },
            ]} />

            {/* LTV gauges */}
            {!!(a.ltv || a.cltv || a.payoffCltv) && (
              <div style={{ marginTop: '20px' }}>
                <LtvBar label="LTV" value={a.ltv as number} />
                <LtvBar label="CLTV" value={a.cltv as number} />
                <LtvBar label="Payoff CLTV" value={a.payoffCltv as number} />
              </div>
            )}
          </div>
        </div>

        {/* Computed metrics */}
        {(totalDebt > 0 || equity !== null) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Total Debt', value: fmtCurrency(totalDebt), highlight: true },
              { label: 'Equity Position', value: equity !== null ? fmtCurrency(equity) : '—', highlight: true },
              { label: 'Equity %', value: equityPct !== null ? `${equityPct.toFixed(1)}%` : '—' },
              { label: 'Monthly Payment', value: monthlyCashFlow > 0 ? fmtCurrency(monthlyCashFlow) : '—' },
              { label: 'Annual Debt Service', value: annualDebtService > 0 ? fmtCurrency(annualDebtService) : '—' },
              { label: 'Months Delinquent', value: monthsDelinquent != null ? String(monthsDelinquent) : '—' },
              { label: 'Est. Total Arrears', value: totalArrears != null && totalArrears > 0 ? fmtCurrency(totalArrears) : '—' },
            ].map(({ label, value, highlight }) => (
              <div key={label}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                <div style={{
                  fontWeight: highlight ? 600 : 400,
                  fontSize: highlight ? '1rem' : '0.88rem',
                  ...(highlight ? { background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: 'var(--text-secondary)' }),
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* ── Section 2: First Mortgage — Current ───────────────── */}
      <CollapsibleSection
        title="First Mortgage — Current"
        defaultOpen
        badge={a.firstMtg_loanStatus as string | undefined}
        badgeColor={(a.firstMtg_loanStatus as string)?.toLowerCase() === 'current' ? 'green' : 'red'}
      >
        <MetricGrid items={[
          { label: 'Original Amount', value: fmtCurrency(a.firstMtg_originalAmount as number), highlight: true },
          { label: 'Current Balance', value: fmtCurrency(a.firstMtg_currentBalance as number), highlight: true },
          { label: 'Interest Rate', value: fmtPct(a.firstMtg_interestRate as number) },
          { label: 'Monthly P&I', value: fmtCurrency(a.firstMtg_monthlyPI as number) },
          { label: 'Monthly Escrow', value: fmtCurrency(a.firstMtg_monthlyEscrow as number) },
          { label: 'Origination Date', value: fmtDate(a.firstMtg_originationDate as string) },
          { label: 'Maturity Date', value: fmtDate(a.firstMtg_maturityDate as string) },
          { label: 'First Payment Date', value: fmtDate(a.firstMtg_firstPaymentDate as string) },
          { label: 'Next Due Date', value: fmtDate(a.firstMtg_nextDueDate as string) },
          { label: 'Loan Term', value: a.firstMtg_loanTermMonths ? `${a.firstMtg_loanTermMonths} months` : '—' },
          { label: 'Months Paid', value: fmtVal(a.firstMtg_totalMonthsPaid) },
          { label: 'Months Remaining', value: fmtVal(a.firstMtg_monthsRemaining) },
          { label: 'Interest Paid To', value: fmtDate(a.firstMtg_interestPaidToDate as string) },
          { label: 'Last Pmt Received', value: fmtDate(a.lastPaymentReceivedDate as string) },
          { label: 'Payment Accepted', value: fmtVal(a.paymentAccepted) },
          { label: 'Interest Only', value: a.isInterestOnly != null ? (a.isInterestOnly ? 'Yes' : 'No') : '—' },
          { label: 'Total Monthly Pmt', value: fmtCurrency(a.totalMonthlyPayment as number) },
          { label: 'Legal Status', value: fmtVal(a.legalStatus) },
          { label: 'Judicial State', value: a.isJudicialState != null ? (a.isJudicialState ? 'Yes' : 'No') : '—' },
        ]} />
      </CollapsibleSection>

      {/* ── Section 3: First Mortgage — Modification ──────────── */}
      {a.firstMtg_isModified && (
        <CollapsibleSection title="First Mortgage — Modification" badge="MODIFIED" badgeColor="gold">
          {a.firstMtg_hasBalloon && a.firstMtg_balloonDate && (
            <div style={{ background: 'rgba(212,168,70,0.08)', border: '1px solid rgba(212,168,70,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '20px', fontSize: '0.82rem' }}>
              <strong style={{ color: 'var(--gold-400)' }}>Balloon Payment Due:</strong>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{fmtDate(a.firstMtg_balloonDate as string)}</span>
            </div>
          )}
          <MetricGrid items={[
            { label: 'Mod Loan Amount', value: fmtCurrency(a.firstMtg_modLoanAmount as number), highlight: true },
            { label: 'Mod Current Balance', value: fmtCurrency(a.firstMtg_modCurrentBalance as number), highlight: true },
            { label: 'Deferred Balance', value: fmtCurrency(a.firstMtg_modDeferredBalance as number) },
            { label: 'Mod Interest Rate', value: fmtPct(a.firstMtg_modInterestRate as number) },
            { label: 'Mod Monthly P&I', value: fmtCurrency(a.firstMtg_modMonthlyPI as number) },
            { label: 'Mod Monthly Escrow', value: fmtCurrency(a.firstMtg_modMonthlyEscrow as number) },
            { label: 'Modification Date', value: fmtDate(a.firstMtg_modDate as string) },
            { label: 'Mod Maturity Date', value: fmtDate(a.firstMtg_modMaturityDate as string) },
            { label: 'Mod First Payment', value: fmtDate(a.firstMtg_modFirstPayDate as string) },
            { label: 'Mod Term', value: a.firstMtg_modTermMonths ? `${a.firstMtg_modTermMonths} months` : '—' },
            { label: 'Mod Months Paid', value: fmtVal(a.firstMtg_modMonthsPaid) },
            { label: 'Payments Remaining', value: fmtVal(a.firstMtg_modPaymentsRemaining) },
            { label: 'Interest Paid To', value: fmtDate(a.firstMtg_modInterestPaidTo as string) },
          ]} />
        </CollapsibleSection>
      )}

      {/* ── Section 4: First Mortgage — Foreclosure ───────────── */}
      {hasFirstForeclosure && (
        <CollapsibleSection title="First Mortgage — Foreclosure" badge="FORECLOSURE" badgeColor="red">
          <MetricGrid items={[
            { label: 'Default Date', value: fmtDate(a.firstMtg_foreclosureDefaultDate as string), highlight: true },
            { label: 'Default Amount', value: fmtCurrency(a.firstMtg_foreclosureDefaultAmt as number), highlight: true },
            { label: 'Sale Date', value: fmtDate(a.firstMtg_foreclosureSaleDate as string) },
          ]} />
        </CollapsibleSection>
      )}

      {/* ── Sections 5-7: Second Mortgage ─────────────────────── */}
      {hasSecond && (
        <>
          <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0 12px', opacity: 0.6 }} />

          <CollapsibleSection
            title="Second Mortgage — Current"
            badge={a.secondMtg_loanStatus as string | undefined}
            badgeColor={(a.secondMtg_loanStatus as string)?.toLowerCase() === 'current' ? 'green' : 'red'}
          >
            <MetricGrid items={[
              { label: 'Original Amount', value: fmtCurrency(a.secondMtg_originalAmount as number), highlight: true },
              { label: 'Current Balance', value: fmtCurrency(a.secondMtg_currentBalance as number), highlight: true },
              { label: 'Interest Rate', value: fmtPct(a.secondMtg_interestRate as number) },
              { label: 'Monthly P&I', value: fmtCurrency(a.secondMtg_monthlyPI as number) },
              { label: 'Monthly Escrow', value: fmtCurrency(a.secondMtg_monthlyEscrow as number) },
              { label: 'Origination Date', value: fmtDate(a.secondMtg_originationDate as string) },
              { label: 'Maturity Date', value: fmtDate(a.secondMtg_maturityDate as string) },
              { label: 'Next Due Date', value: fmtDate(a.secondMtg_nextDueDate as string) },
              { label: 'Months Remaining', value: fmtVal(a.secondMtg_monthsRemaining) },
            ]} />
          </CollapsibleSection>

          {a.secondMtg_isModified && (
            <CollapsibleSection title="Second Mortgage — Modification" badge="MODIFIED" badgeColor="gold">
              <MetricGrid items={[
                { label: 'Mod Loan Amount', value: fmtCurrency(a.secondMtg_modLoanAmount as number), highlight: true },
                { label: 'Mod Current Balance', value: fmtCurrency(a.secondMtg_modCurrentBalance as number), highlight: true },
                { label: 'Mod Interest Rate', value: fmtPct(a.secondMtg_modInterestRate as number) },
                { label: 'Mod Monthly P&I', value: fmtCurrency(a.secondMtg_modMonthlyPI as number) },
                { label: 'Modification Date', value: fmtDate(a.secondMtg_modDate as string) },
                { label: 'Payments Remaining', value: fmtVal(a.secondMtg_modPaymentsRemaining) },
              ]} />
            </CollapsibleSection>
          )}

          {hasSecondForeclosure && (
            <CollapsibleSection title="Second Mortgage — Foreclosure" badge="FORECLOSURE" badgeColor="red">
              <MetricGrid items={[
                { label: 'Default Date', value: fmtDate(a.secondMtg_foreclosureDefaultDate as string), highlight: true },
                { label: 'Default Amount', value: fmtCurrency(a.secondMtg_foreclosureDefaultAmt as number), highlight: true },
                { label: 'Sale Date', value: fmtDate(a.secondMtg_foreclosureSaleDate as string) },
              ]} />
            </CollapsibleSection>
          )}
        </>
      )}

      {/* ── Section 8: Bankruptcy ─────────────────────────────── */}
      {hasBk && (
        <CollapsibleSection
          title="Bankruptcy"
          badge={a.isInBankruptcy ? `Active Ch. ${a.bankruptcyChapter ?? '?'}` : undefined}
          badgeColor="red"
        >
          {/* Current */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>Current Status</div>
            <MetricGrid items={[
              { label: 'In Bankruptcy', value: fmtVal(a.isInBankruptcy), highlight: a.isInBankruptcy as boolean },
              { label: 'Chapter', value: fmtVal(a.bankruptcyChapter) },
              { label: 'Filing Date', value: fmtDate(a.bkFilingDate as string) },
              { label: 'Confirmation Date', value: fmtDate(a.bkConfirmationDate as string) },
              { label: 'Dismissal Date', value: fmtDate(a.bkDismissalDate as string) },
              { label: 'Ch.13 POC Filing', value: fmtDate(a.ch13PocFilingDate as string) },
              { label: 'Ch.13 Discharged', value: fmtDate(a.ch13DischargedDate as string) },
            ]} />
          </div>

          {/* History */}
          {(a.ch7PetitionDate || a.ch7CaseNumber || a.prevCh13PetitionDate) && (
            <>
              <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 16px' }} />
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '12px' }}>Previous History</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {(a.ch7PetitionDate || a.ch7CaseNumber) && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gold-400)', marginBottom: '10px', fontWeight: 600 }}>Chapter 7</div>
                    <MetricGrid items={[
                      { label: 'Petition Date', value: fmtDate(a.ch7PetitionDate as string) },
                      { label: 'Case Number', value: fmtVal(a.ch7CaseNumber) },
                      { label: 'Date Filed', value: fmtDate(a.ch7DateFiled as string) },
                      { label: 'Dismissal', value: fmtDate(a.ch7DismissalDate as string) },
                      { label: 'Discharge', value: fmtDate(a.ch7DischargeDate as string) },
                    ]} />
                  </div>
                )}
                {(a.prevCh13PetitionDate || a.prevCh13CaseNumber) && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gold-400)', marginBottom: '10px', fontWeight: 600 }}>Chapter 13 (Previous)</div>
                    <MetricGrid items={[
                      { label: 'Petition Date', value: fmtDate(a.prevCh13PetitionDate as string) },
                      { label: 'Case Number', value: fmtVal(a.prevCh13CaseNumber) },
                      { label: 'Date Filed', value: fmtDate(a.prevCh13DateFiled as string) },
                      { label: 'Dismissal', value: fmtDate(a.prevCh13DismissalDate as string) },
                      { label: 'Discharge', value: fmtDate(a.prevCh13DischargeDate as string) },
                    ]} />
                  </div>
                )}
              </div>
            </>
          )}
        </CollapsibleSection>
      )}
    </div>
  )
}
