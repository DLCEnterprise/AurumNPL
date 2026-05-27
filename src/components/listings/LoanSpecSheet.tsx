'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────────────────────

type SerializedAsset = {
  [key: string]: unknown
}

type ListingMeta = {
  performanceStatus?: string | null
  noteType?: string | null
  lienPosition?: 'SENIOR' | 'JUNIOR' | null
  unpaidBalance?: number | null
  askingPrice?: number | null
}

type Variant = 'default' | 'positive' | 'warning' | 'danger' | 'muted'

type SpecItem = {
  label: string
  value: string
  variant?: Variant
} | false | null | undefined

// ── Hardest Hit Fund states (federal HFA Hardest Hit Fund program) ────────────
const HHF_STATES = new Set([
  'AL', 'AZ', 'CA', 'DC', 'FL', 'GA', 'IL', 'IN', 'KY', 'MI',
  'MS', 'NC', 'NJ', 'NV', 'OH', 'OR', 'RI', 'SC', 'TN',
])

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 2,
  }).format(n)
}

function fmtCurrencyWhole(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

function fmtPct(n: number | null | undefined, decimals = 3): string {
  if (n == null) return '—'
  // Asset rates are stored as decimals (0.0725 = 7.25%); convert.
  return `${(n * 100).toFixed(decimals)}%`
}

function fmtPctRaw(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '—'
  return `${n.toFixed(decimals)}%`
}

function fmtDate(s: string | Date | null | undefined): string {
  if (!s) return '—'
  const d = typeof s === 'string' ? new Date(s) : s
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtBool(v: boolean | null | undefined): string {
  if (v == null) return '—'
  return v ? 'Yes' : 'No'
}

function fmtNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

// ── Spec primitives ───────────────────────────────────────────────────────────

function SpecRow({ label, value, variant }: { label: string; value: string; variant?: Variant }) {
  const valueClass =
    variant === 'positive' ? 'spec-row__value spec-row__value--positive' :
    variant === 'warning'  ? 'spec-row__value spec-row__value--warning'  :
    variant === 'danger'   ? 'spec-row__value spec-row__value--danger'   :
    variant === 'muted'    ? 'spec-row__value spec-row__value--muted'    :
                             'spec-row__value'
  return (
    <div className="spec-row">
      <span className="spec-row__label">{label}</span>
      <span className="spec-row__leader" aria-hidden="true" />
      <span className={valueClass}>{value}</span>
    </div>
  )
}

function SpecGrid({ items }: { items: SpecItem[] }) {
  const present = items.filter(Boolean) as Array<{ label: string; value: string; variant?: Variant }>
  if (present.length === 0) return null
  return (
    <div className="spec-grid">
      {present.map((item) => (
        <SpecRow key={item.label} label={item.label} value={item.value} variant={item.variant} />
      ))}
    </div>
  )
}

function SectionHeader({ title, badge, badgeColor }: { title: string; badge?: string; badgeColor?: 'gold' | 'red' | 'green' }) {
  const badgeBg =
    badgeColor === 'red'   ? 'rgba(239,68,68,0.1)' :
    badgeColor === 'green' ? 'rgba(52,211,153,0.1)' :
                             'rgba(212,168,70,0.1)'
  const badgeFg =
    badgeColor === 'red'   ? '#f87171' :
    badgeColor === 'green' ? '#34d399' :
                             'var(--gold-400)'
  const badgeBorder =
    badgeColor === 'red'   ? 'rgba(239,68,68,0.22)' :
    badgeColor === 'green' ? 'rgba(52,211,153,0.22)' :
                             'rgba(212,168,70,0.22)'
  return (
    <div className="spec-section__header">
      <span className="spec-section__title">{title}</span>
      {badge && (
        <span style={{
          fontSize: '0.62rem',
          padding: '2px 9px',
          borderRadius: '100px',
          background: badgeBg,
          color: badgeFg,
          border: `1px solid ${badgeBorder}`,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {badge}
        </span>
      )}
      <span className="spec-section__rule" />
    </div>
  )
}

function Collapsible({
  title,
  badge,
  badgeColor,
  defaultOpen = false,
  children,
}: {
  title: string
  badge?: string
  badgeColor?: 'gold' | 'red' | 'green'
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const badgeBg =
    badgeColor === 'red'   ? 'rgba(239,68,68,0.1)' :
    badgeColor === 'green' ? 'rgba(52,211,153,0.1)' :
                             'rgba(212,168,70,0.1)'
  const badgeFg =
    badgeColor === 'red'   ? '#f87171' :
    badgeColor === 'green' ? '#34d399' :
                             'var(--gold-400)'
  const badgeBorder =
    badgeColor === 'red'   ? 'rgba(239,68,68,0.22)' :
    badgeColor === 'green' ? 'rgba(52,211,153,0.22)' :
                             'rgba(212,168,70,0.22)'

  return (
    <div className="glass-card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 28px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="spec-section__title">{title}</span>
          {badge && (
            <span style={{
              fontSize: '0.62rem', padding: '2px 9px', borderRadius: '100px',
              background: badgeBg, color: badgeFg, border: `1px solid ${badgeBorder}`,
              fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {badge}
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-muted)" strokeWidth="2.2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.85 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 28px 24px' }}>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '18px' }} />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function LoanSpecSheet({ asset, listing }: { asset: SerializedAsset; listing: ListingMeta }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = asset as Record<string, any>

  const isModified = !!a.firstMtg_isModified
  const isSecondModified = !!a.secondMtg_isModified
  const hasSecond = !!(a.secondMtg_currentBalance || a.secondMtg_loanStatus || a.secondMtg_originalAmount)
  const hasBk = !!(a.isInBankruptcy || a.bkFilingDate || a.ch7PetitionDate || a.prevCh13PetitionDate)
  const hasFirstForeclosure = !!(a.firstMtg_foreclosureDefaultDate || a.firstMtg_foreclosureSaleDate)
  const hasSecondForeclosure = !!(a.secondMtg_foreclosureDefaultDate || a.secondMtg_foreclosureSaleDate)

  // Effective UPB — use modified balance if loan is modified
  const upb = isModified
    ? (a.firstMtg_modCurrentBalance ?? a.firstMtg_currentBalance ?? listing.unpaidBalance ?? null)
    : (a.firstMtg_currentBalance ?? listing.unpaidBalance ?? null)

  const origAmount = a.firstMtg_originalAmount ?? null
  const interestRate = isModified ? (a.firstMtg_modInterestRate ?? a.firstMtg_interestRate) : a.firstMtg_interestRate
  const monthlyPI = isModified ? (a.firstMtg_modMonthlyPI ?? a.firstMtg_monthlyPI) : a.firstMtg_monthlyPI
  const monthlyEscrow = isModified ? (a.firstMtg_modMonthlyEscrow ?? a.firstMtg_monthlyEscrow) : a.firstMtg_monthlyEscrow
  const totalMonthly = a.totalMonthlyPayment ?? (monthlyPI != null && monthlyEscrow != null ? monthlyPI + monthlyEscrow : monthlyPI)
  const maturityDate = isModified ? (a.firstMtg_modMaturityDate ?? a.firstMtg_maturityDate) : a.firstMtg_maturityDate
  const paymentsRemaining = isModified
    ? (a.firstMtg_modPaymentsRemaining ?? a.firstMtg_monthsRemaining)
    : a.firstMtg_monthsRemaining

  // Total Payoff = current balance + accrued interest + late fees
  const accrued = a.firstMtg_accruedInterest ?? 0
  const lateFees = a.firstMtg_lateFees ?? 0
  const totalPayoff = upb != null ? upb + accrued + lateFees : null

  const isJudicial = a.isJudicialState as boolean | null | undefined
  const isHHF = a.propertyState && HHF_STATES.has(String(a.propertyState).toUpperCase())

  // ── Delinquency calculation ─────────────────────────────────────
  // Anchor off the contractual next-due date; fall back to last-payment-
  // received only when no next-due is set. If next-due is in the future the
  // loan is current; otherwise compute months/days past due.
  const nextDueStr = a.firstMtg_nextDueDate as string | null
  const lastPmtStr = a.lastPaymentReceivedDate as string | null
  const delinquencyAnchor = nextDueStr || lastPmtStr
  let monthsDelinquent: number | null = null
  let daysDelinquent:   number | null = null
  let isDelinquent = false
  let anchorDate: Date | null = null
  if (delinquencyAnchor) {
    const ref = new Date(delinquencyAnchor)
    if (!isNaN(ref.getTime())) {
      anchorDate = ref
      const now = new Date()
      if (ref.getTime() < now.getTime()) {
        const msPerDay = 1000 * 60 * 60 * 24
        daysDelinquent = Math.floor((now.getTime() - ref.getTime()) / msPerDay)
        monthsDelinquent = Math.max(
          0,
          (now.getFullYear() - ref.getFullYear()) * 12 + (now.getMonth() - ref.getMonth())
        )
        isDelinquent = daysDelinquent > 0
      }
    }
  }
  const timeInDefaultDisplay = isDelinquent && monthsDelinquent != null && daysDelinquent != null
    ? `${monthsDelinquent} mo · ${daysDelinquent.toLocaleString()} days`
    : (anchorDate && !isDelinquent ? 'Current' : '—')
  const delinquencyVariant: Variant | undefined =
    !isDelinquent ? 'positive' :
    (daysDelinquent != null && daysDelinquent >= 90) ? 'danger' :
    (daysDelinquent != null && daysDelinquent >= 30) ? 'warning' : undefined

  const performance = listing.performanceStatus ?? null
  const performanceVariant: Variant | undefined =
    performance === 'Performing' ? 'positive' :
    performance === 'Non-Performing' ? 'danger' :
    performance === 'Re-Performing' ? 'warning' : undefined

  const loanStatus = (a.firstMtg_loanStatus as string | null) ?? null
  const loanStatusBadge = loanStatus ? loanStatus : (isModified ? 'MODIFIED' : undefined)
  const loanStatusColor: 'gold' | 'red' | 'green' | undefined =
    loanStatus?.toLowerCase() === 'current' ? 'green' :
    loanStatus ? 'red' :
    isModified ? 'gold' : undefined

  // Banner color when delinquent
  const bannerSeverity =
    daysDelinquent != null && daysDelinquent >= 90 ? 'danger' :
    daysDelinquent != null && daysDelinquent >= 30 ? 'warning' : 'gold'
  const bannerBg =
    bannerSeverity === 'danger'  ? 'rgba(239, 68, 68, 0.05)' :
    bannerSeverity === 'warning' ? 'rgba(251, 191, 36, 0.05)' :
                                   'rgba(212, 168, 70, 0.04)'
  const bannerBorder =
    bannerSeverity === 'danger'  ? 'rgba(239, 68, 68, 0.25)' :
    bannerSeverity === 'warning' ? 'rgba(251, 191, 36, 0.25)' :
                                   'rgba(212, 168, 70, 0.2)'
  const bannerAccent =
    bannerSeverity === 'danger'  ? '#f87171' :
    bannerSeverity === 'warning' ? '#fbbf24' :
                                   'var(--gold-400)'

  return (
    <div>
      {/* ── Delinquency banner (only when past due) ──────────────── */}
      {isDelinquent && daysDelinquent != null && monthsDelinquent != null && (
        <div className="glass-card" style={{
          padding: '16px 24px',
          marginBottom: '14px',
          background: bannerBg,
          border: `1px solid ${bannerBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
        }}>
          {/* Pulse indicator */}
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: `${bannerAccent}1f`,
            border: `1px solid ${bannerAccent}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={bannerAccent} strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.66rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: bannerAccent,
              marginBottom: '4px',
            }}>
              Default Status · Past Due
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
              {monthsDelinquent} {monthsDelinquent === 1 ? 'month' : 'months'} <span style={{ color: 'var(--text-muted)' }}>·</span> {daysDelinquent.toLocaleString()} days delinquent
              {anchorDate && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {'  ·  '}contractual due {anchorDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTE TERMS — the hero spec sheet ─────────────────────── */}
      <div className="glass-card" style={{ marginBottom: '14px' }}>
        <div className="spec-section">
          <SectionHeader
            title="Note Terms"
            badge={loanStatusBadge}
            badgeColor={loanStatusColor}
          />

          <SpecGrid items={[
            { label: 'Lien Position', value: listing.lienPosition === 'SENIOR' ? '1st' : listing.lienPosition === 'JUNIOR' ? '2nd' : '—' },
            { label: 'Performance', value: performance ?? '—', variant: performanceVariant },
            { label: 'Note Type', value: listing.noteType ?? '—' },
            { label: 'Legal Status', value: (a.legalStatus as string) ?? 'None' },
            { label: 'Unpaid Principal Balance', value: fmtCurrency(upb), variant: 'positive' },
            { label: 'Loan to Value', value: a.ltv != null ? fmtPctRaw((a.ltv as number) * 100, 0) : '—' },
            { label: 'Origination Date', value: fmtDate(a.firstMtg_originationDate as string) },
            { label: 'Original Balance', value: fmtCurrency(origAmount) },
            { label: 'Total Payoff', value: fmtCurrency(totalPayoff) },
            { label: 'Payments Remaining', value: fmtNumber(paymentsRemaining) },
            { label: 'Interest Rate', value: fmtPct(interestRate, 3) },
            { label: 'Interest-Only Loan', value: fmtBool(a.isInterestOnly as boolean | null) },
            { label: 'Principal & Interest Payment', value: fmtCurrency(monthlyPI) },
            { label: 'Escrow / Impounds', value: fmtCurrency(monthlyEscrow) },
            { label: 'Total Monthly Loan Payment', value: fmtCurrency(totalMonthly) },
            { label: 'Last Payment Received', value: fmtDate(a.lastPaymentReceivedDate as string) },
            { label: 'Next Payment Date', value: fmtDate(a.firstMtg_nextDueDate as string) },
            { label: 'Time in Default', value: timeInDefaultDisplay, variant: delinquencyVariant },
            { label: 'Months Delinquent', value: isDelinquent && monthsDelinquent != null ? String(monthsDelinquent) : (anchorDate ? '0' : '—'), variant: delinquencyVariant },
            { label: 'Maturity Date', value: fmtDate(maturityDate as string) },
            { label: 'Accrued Late Charges', value: fmtCurrency(a.firstMtg_lateFees as number) },
            { label: 'Accrued Interest', value: fmtCurrency(a.firstMtg_accruedInterest as number) },
            { label: 'Hardest Hit Fund State', value: a.propertyState ? (isHHF ? 'Yes' : 'No') : '—' },
            { label: 'Judicial State', value: isJudicial == null ? '—' : (isJudicial ? 'Yes' : 'No') },
            { label: 'Non-Judicial State', value: isJudicial == null ? '—' : (isJudicial ? 'No' : 'Yes') },
          ]} />
        </div>

        {/* CLTV / collateral coverage (only when present) */}
        {(a.cltv != null || a.payoffCltv != null || a.fairMarketValue != null) && (
          <div className="spec-section">
            <SectionHeader title="Collateral Coverage" />
            <SpecGrid items={[
              a.fairMarketValue != null && { label: 'Fair Market Value', value: fmtCurrencyWhole(a.fairMarketValue as number), variant: 'positive' as Variant },
              a.ltv         != null && { label: 'LTV',         value: fmtPctRaw((a.ltv as number) * 100, 1) },
              a.cltv        != null && { label: 'CLTV',        value: fmtPctRaw((a.cltv as number) * 100, 1) },
              a.payoffCltv  != null && { label: 'Payoff CLTV', value: fmtPctRaw((a.payoffCltv as number) * 100, 1) },
              a.homePurchaseDate  != null && { label: 'Purchase Date',  value: fmtDate(a.homePurchaseDate as string) },
              a.homePurchasePrice != null && { label: 'Purchase Price', value: fmtCurrencyWhole(a.homePurchasePrice as number) },
            ]} />
          </div>
        )}
      </div>

      {/* ── Modification (only if modified) ──────────────────────── */}
      {isModified && (
        <Collapsible title="First Mortgage — Modification" badge="Modified" badgeColor="gold" defaultOpen>
          {a.firstMtg_hasBalloon && a.firstMtg_balloonDate && (
            <div style={{
              background: 'rgba(212,168,70,0.06)',
              border: '1px solid rgba(212,168,70,0.18)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '18px',
              fontSize: '0.82rem',
            }}>
              <strong style={{ color: 'var(--gold-400)', letterSpacing: '0.04em' }}>Balloon Payment Due</strong>
              <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>·</span>
              <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtDate(a.firstMtg_balloonDate as string)}
              </span>
            </div>
          )}
          <SpecGrid items={[
            { label: 'Mod Loan Amount',     value: fmtCurrency(a.firstMtg_modLoanAmount as number) },
            { label: 'Mod Current Balance', value: fmtCurrency(a.firstMtg_modCurrentBalance as number) },
            a.firstMtg_modDeferredBalance != null && { label: 'Deferred Balance', value: fmtCurrency(a.firstMtg_modDeferredBalance as number) },
            { label: 'Mod Interest Rate',   value: fmtPct(a.firstMtg_modInterestRate as number, 3) },
            { label: 'Mod Monthly P&I',     value: fmtCurrency(a.firstMtg_modMonthlyPI as number) },
            { label: 'Mod Monthly Escrow',  value: fmtCurrency(a.firstMtg_modMonthlyEscrow as number) },
            { label: 'Modification Date',   value: fmtDate(a.firstMtg_modDate as string) },
            { label: 'Mod Maturity Date',   value: fmtDate(a.firstMtg_modMaturityDate as string) },
            { label: 'Mod First Payment',   value: fmtDate(a.firstMtg_modFirstPayDate as string) },
            a.firstMtg_modTermMonths != null && { label: 'Mod Term', value: `${a.firstMtg_modTermMonths} months` },
            { label: 'Mod Months Paid',     value: fmtNumber(a.firstMtg_modMonthsPaid as number) },
            { label: 'Payments Remaining',  value: fmtNumber(a.firstMtg_modPaymentsRemaining as number) },
            { label: 'Interest Paid To',    value: fmtDate(a.firstMtg_modInterestPaidTo as string) },
          ]} />
        </Collapsible>
      )}

      {/* ── First Mortgage Foreclosure ───────────────────────────── */}
      {hasFirstForeclosure && (
        <Collapsible title="First Mortgage — Foreclosure" badge="Foreclosure" badgeColor="red" defaultOpen>
          <SpecGrid items={[
            { label: 'Default Date',   value: fmtDate(a.firstMtg_foreclosureDefaultDate as string) },
            { label: 'Default Amount', value: fmtCurrency(a.firstMtg_foreclosureDefaultAmt as number), variant: 'danger' },
            { label: 'Sale Date',      value: fmtDate(a.firstMtg_foreclosureSaleDate as string) },
          ]} />
        </Collapsible>
      )}

      {/* ── Second Mortgage ──────────────────────────────────────── */}
      {hasSecond && (
        <Collapsible
          title="Second Mortgage — Current"
          badge={a.secondMtg_loanStatus as string | undefined}
          badgeColor={(a.secondMtg_loanStatus as string)?.toLowerCase() === 'current' ? 'green' : 'red'}
        >
          <SpecGrid items={[
            { label: 'Original Amount',  value: fmtCurrency(a.secondMtg_originalAmount as number) },
            { label: 'Current Balance',  value: fmtCurrency(a.secondMtg_currentBalance as number) },
            { label: 'Interest Rate',    value: fmtPct(a.secondMtg_interestRate as number, 3) },
            { label: 'Monthly P&I',      value: fmtCurrency(a.secondMtg_monthlyPI as number) },
            { label: 'Monthly Escrow',   value: fmtCurrency(a.secondMtg_monthlyEscrow as number) },
            { label: 'Origination Date', value: fmtDate(a.secondMtg_originationDate as string) },
            { label: 'Maturity Date',    value: fmtDate(a.secondMtg_maturityDate as string) },
            { label: 'Next Due Date',    value: fmtDate(a.secondMtg_nextDueDate as string) },
            { label: 'Months Remaining', value: fmtNumber(a.secondMtg_monthsRemaining as number) },
          ]} />
        </Collapsible>
      )}

      {isSecondModified && (
        <Collapsible title="Second Mortgage — Modification" badge="Modified" badgeColor="gold">
          <SpecGrid items={[
            { label: 'Mod Loan Amount',     value: fmtCurrency(a.secondMtg_modLoanAmount as number) },
            { label: 'Mod Current Balance', value: fmtCurrency(a.secondMtg_modCurrentBalance as number) },
            { label: 'Mod Interest Rate',   value: fmtPct(a.secondMtg_modInterestRate as number, 3) },
            { label: 'Mod Monthly P&I',     value: fmtCurrency(a.secondMtg_modMonthlyPI as number) },
            { label: 'Modification Date',   value: fmtDate(a.secondMtg_modDate as string) },
            { label: 'Payments Remaining',  value: fmtNumber(a.secondMtg_modPaymentsRemaining as number) },
          ]} />
        </Collapsible>
      )}

      {hasSecondForeclosure && (
        <Collapsible title="Second Mortgage — Foreclosure" badge="Foreclosure" badgeColor="red">
          <SpecGrid items={[
            { label: 'Default Date',   value: fmtDate(a.secondMtg_foreclosureDefaultDate as string) },
            { label: 'Default Amount', value: fmtCurrency(a.secondMtg_foreclosureDefaultAmt as number), variant: 'danger' },
            { label: 'Sale Date',      value: fmtDate(a.secondMtg_foreclosureSaleDate as string) },
          ]} />
        </Collapsible>
      )}

      {/* ── Bankruptcy ───────────────────────────────────────────── */}
      {hasBk && (
        <Collapsible
          title="Bankruptcy"
          badge={a.isInBankruptcy ? `Active Ch. ${a.bankruptcyChapter ?? '?'}` : 'History'}
          badgeColor={a.isInBankruptcy ? 'red' : 'gold'}
        >
          {/* Current status */}
          {(a.isInBankruptcy || a.bkFilingDate || a.bkConfirmationDate || a.bkDismissalDate) && (
            <>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-400)', marginBottom: '12px', fontWeight: 600 }}>
                Current Status
              </div>
              <SpecGrid items={[
                { label: 'In Bankruptcy',     value: fmtBool(a.isInBankruptcy as boolean), variant: a.isInBankruptcy ? 'danger' : undefined },
                { label: 'Chapter',           value: (a.bankruptcyChapter as string) ?? '—' },
                a.bkCaseNumber       && { label: 'Case Number',       value: String(a.bkCaseNumber) },
                a.bkFilingDate       && { label: 'Filing Date',       value: fmtDate(a.bkFilingDate as string) },
                a.bkConfirmationDate && { label: 'Confirmation Date', value: fmtDate(a.bkConfirmationDate as string) },
                a.bkDismissalDate    && { label: 'Dismissal Date',    value: fmtDate(a.bkDismissalDate as string) },
                a.ch13PocFilingDate  && { label: 'Ch.13 POC Filing',  value: fmtDate(a.ch13PocFilingDate as string) },
                a.ch13DischargedDate && { label: 'Ch.13 Discharged',  value: fmtDate(a.ch13DischargedDate as string) },
              ]} />
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />
            </>
          )}

          {(a.ch7PetitionDate || a.ch7CaseNumber) && (
            <>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-400)', marginBottom: '12px', fontWeight: 600 }}>
                Chapter 7 (Previous)
              </div>
              <SpecGrid items={[
                { label: 'Petition Date', value: fmtDate(a.ch7PetitionDate as string) },
                { label: 'Case Number',   value: (a.ch7CaseNumber as string) ?? '—' },
                a.ch7DateFiled      && { label: 'Date Filed',  value: fmtDate(a.ch7DateFiled as string) },
                a.ch7DismissalDate  && { label: 'Dismissal',   value: fmtDate(a.ch7DismissalDate as string) },
                a.ch7DischargeDate  && { label: 'Discharge',   value: fmtDate(a.ch7DischargeDate as string) },
              ]} />
            </>
          )}

          {(a.prevCh13PetitionDate || a.prevCh13CaseNumber) && (
            <>
              {(a.ch7PetitionDate || a.ch7CaseNumber) && (
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />
              )}
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-400)', marginBottom: '12px', fontWeight: 600 }}>
                Chapter 13 (Previous)
              </div>
              <SpecGrid items={[
                { label: 'Petition Date', value: fmtDate(a.prevCh13PetitionDate as string) },
                { label: 'Case Number',   value: (a.prevCh13CaseNumber as string) ?? '—' },
                a.prevCh13DateFiled      && { label: 'Date Filed',  value: fmtDate(a.prevCh13DateFiled as string) },
                a.prevCh13DismissalDate  && { label: 'Dismissal',   value: fmtDate(a.prevCh13DismissalDate as string) },
                a.prevCh13DischargeDate  && { label: 'Discharge',   value: fmtDate(a.prevCh13DischargeDate as string) },
              ]} />
            </>
          )}
        </Collapsible>
      )}
    </div>
  )
}
