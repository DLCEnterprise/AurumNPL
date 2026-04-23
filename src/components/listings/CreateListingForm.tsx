'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'
import { CurrencyInput, PercentInput } from '@/components/ui/FormattedInputs'

// ── Step definitions ───────────────────────────────────────────────────────────

const SINGLE_STEPS    = ['Deal Setup', 'Note Terms', 'Property', 'Legal & Status', 'Deal Terms', 'Documents', 'Review']
const PORTFOLIO_STEPS = ['Deal Setup', 'Portfolio Summary', 'Collateral Overview', 'Deal Terms', 'Documents', 'Review']

// ── Form types ─────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Deal Setup
  listingType: string
  performanceStatus: string
  assetType: string
  lienPosition: string
  noteType: string
  title: string
  description: string
  // Shared financial
  loanCount: string
  unpaidBalance: string
  avgDelinquency: string
  location: string
  region: string
  // Portfolio extras (packed into description on submit)
  avgInterestRate: string
  avgLTV: string
  assetTypeMix: string
  occupancyMix: string
  pctNPL: string
  pctPerforming: string
  // Single — Note Terms
  firstMtg_interestRate: string
  firstMtg_originationDate: string
  firstMtg_maturityDate: string
  firstMtg_firstPaymentDate: string
  firstMtg_originalAmount: string
  firstMtg_currentBalance: string
  firstMtg_monthlyPI: string
  firstMtg_monthlyEscrow: string
  firstMtg_nextDueDate: string
  firstMtg_loanTermMonths: string
  firstMtg_totalMonthsPaid: string
  firstMtg_monthsRemaining: string
  firstMtg_interestPaidToDate: string
  firstMtg_loanStatus: string
  lastPaymentReceivedDate: string
  paymentAccepted: string
  isInterestOnly: string
  interestOnlyPeriod: string
  totalMonthlyPayment: string
  // Single — Property
  propertyType: string
  propertyStreet: string
  propertyCity: string
  propertyState: string
  propertyZip: string
  county: string
  yearBuilt: string
  floorSizeSqFt: string
  lotSizeSqFt: string
  bedrooms: string
  bathrooms: string
  occupancyType: string
  fairMarketValue: string
  homePurchaseDate: string
  homePurchasePrice: string
  ltv: string
  cltv: string
  // Single — Legal & Status
  legalStatus: string
  isJudicialState: string
  borrowerEverFiledBK: string   // gate: 'false' | 'true'
  isInBankruptcy: string
  bankruptcyChapter: string
  bkCaseNumber: string
  bkFilingDate: string
  ch13PocFilingDate: string
  bkConfirmationDate: string
  bkDismissalDate: string
  ch13DischargedDate: string
  ch7PetitionDate: string
  ch7CaseNumber: string
  ch7DateFiled: string
  ch7DismissalDate: string
  ch7DischargeDate: string
  prevCh13PetitionDate: string
  prevCh13CaseNumber: string
  prevCh13DateFiled: string
  prevCh13DismissalDate: string
  prevCh13DischargeDate: string
  firstMtg_foreclosureDefaultDate: string
  firstMtg_foreclosureDefaultAmt: string
  firstMtg_foreclosureSaleDate: string
  secondMtg_loanStatus: string
  secondMtg_originationDate: string
  secondMtg_maturityDate: string
  secondMtg_originalAmount: string
  secondMtg_currentBalance: string
  secondMtg_interestRate: string
  secondMtg_monthlyPI: string
  secondMtg_nextDueDate: string
  secondMtg_foreclosureDefaultDate: string
  secondMtg_foreclosureDefaultAmt: string
  secondMtg_foreclosureSaleDate: string
  firstMtg_isModified: string
  firstMtg_hasBalloon: string
  firstMtg_balloonDate: string
  firstMtg_modDate: string
  firstMtg_modMaturityDate: string
  firstMtg_modTermMonths: string
  firstMtg_modFirstPayDate: string
  firstMtg_modInterestRate: string
  firstMtg_modLoanAmount: string
  firstMtg_modCurrentBalance: string
  firstMtg_modDeferredBalance: string
  firstMtg_modMonthlyPI: string
  firstMtg_modMonthlyEscrow: string
  firstMtg_modMonthsPaid: string
  firstMtg_modPaymentsRemaining: string
  secondMtg_isModified: string
  secondMtg_hasBalloon: string
  secondMtg_balloonDate: string
  secondMtg_modDate: string
  secondMtg_modMaturityDate: string
  secondMtg_modTermMonths: string
  secondMtg_modFirstPayDate: string
  secondMtg_modInterestRate: string
  secondMtg_modLoanAmount: string
  secondMtg_modCurrentBalance: string
  secondMtg_modDeferredBalance: string
  secondMtg_modMonthlyPI: string
  secondMtg_modPaymentsRemaining: string
  // Payoff components for Payoff CLTV calculation
  firstMtg_accruedInterest: string
  firstMtg_lateFees: string
  secondMtg_accruedInterest: string
  secondMtg_lateFees: string
  payoffCltv: string
  // Deal Terms
  askingPrice: string
  reservePrice: string
  bidDeadline: string
  preferredClosingDays: string
  ndaRequired: string
  // Documents
  dropboxLink: string
  loanTapeLink: string
  status: 'DRAFT' | 'ACTIVE'
}

const EMPTY: FormData = {
  listingType: '', performanceStatus: 'NPL', assetType: 'RESIDENTIAL',
  lienPosition: 'SENIOR', noteType: 'FIXED', title: '', description: '',
  loanCount: '', unpaidBalance: '', avgDelinquency: '', location: '', region: '',
  avgInterestRate: '', avgLTV: '', assetTypeMix: '', occupancyMix: '', pctNPL: '', pctPerforming: '',
  firstMtg_interestRate: '', firstMtg_originationDate: '', firstMtg_maturityDate: '',
  firstMtg_firstPaymentDate: '', firstMtg_originalAmount: '', firstMtg_currentBalance: '',
  firstMtg_monthlyPI: '', firstMtg_monthlyEscrow: '', firstMtg_nextDueDate: '',
  firstMtg_loanTermMonths: '', firstMtg_totalMonthsPaid: '', firstMtg_monthsRemaining: '',
  firstMtg_interestPaidToDate: '', firstMtg_loanStatus: 'Non-Performing',
  lastPaymentReceivedDate: '', paymentAccepted: '', isInterestOnly: 'false',
  interestOnlyPeriod: '', totalMonthlyPayment: '',
  propertyType: 'SFR', propertyStreet: '', propertyCity: '', propertyState: '',
  propertyZip: '', county: '', yearBuilt: '', floorSizeSqFt: '', lotSizeSqFt: '',
  bedrooms: '', bathrooms: '', occupancyType: '', fairMarketValue: '',
  homePurchaseDate: '', homePurchasePrice: '', ltv: '', cltv: '',
  legalStatus: '', isJudicialState: 'false',
  borrowerEverFiledBK: 'false', isInBankruptcy: 'false', bankruptcyChapter: '', bkCaseNumber: '',
  bkFilingDate: '', ch13PocFilingDate: '',
  bkConfirmationDate: '', bkDismissalDate: '', ch13DischargedDate: '',
  ch7PetitionDate: '', ch7CaseNumber: '', ch7DateFiled: '', ch7DismissalDate: '', ch7DischargeDate: '',
  prevCh13PetitionDate: '', prevCh13CaseNumber: '', prevCh13DateFiled: '',
  prevCh13DismissalDate: '', prevCh13DischargeDate: '',
  firstMtg_foreclosureDefaultDate: '', firstMtg_foreclosureDefaultAmt: '', firstMtg_foreclosureSaleDate: '',
  secondMtg_loanStatus: '', secondMtg_originationDate: '', secondMtg_maturityDate: '',
  secondMtg_originalAmount: '', secondMtg_currentBalance: '', secondMtg_interestRate: '',
  secondMtg_monthlyPI: '', secondMtg_nextDueDate: '',
  secondMtg_foreclosureDefaultDate: '', secondMtg_foreclosureDefaultAmt: '', secondMtg_foreclosureSaleDate: '',
  firstMtg_isModified: 'false', firstMtg_hasBalloon: 'false', firstMtg_balloonDate: '',
  firstMtg_modDate: '', firstMtg_modMaturityDate: '', firstMtg_modTermMonths: '',
  firstMtg_modFirstPayDate: '', firstMtg_modInterestRate: '', firstMtg_modLoanAmount: '',
  firstMtg_modCurrentBalance: '', firstMtg_modDeferredBalance: '', firstMtg_modMonthlyPI: '',
  firstMtg_modMonthlyEscrow: '', firstMtg_modMonthsPaid: '', firstMtg_modPaymentsRemaining: '',
  secondMtg_isModified: 'false', secondMtg_hasBalloon: 'false', secondMtg_balloonDate: '',
  secondMtg_modDate: '', secondMtg_modMaturityDate: '', secondMtg_modTermMonths: '',
  secondMtg_modFirstPayDate: '', secondMtg_modInterestRate: '', secondMtg_modLoanAmount: '',
  secondMtg_modCurrentBalance: '', secondMtg_modDeferredBalance: '', secondMtg_modMonthlyPI: '',
  secondMtg_modPaymentsRemaining: '',
  firstMtg_accruedInterest: '', firstMtg_lateFees: '',
  secondMtg_accruedInterest: '', secondMtg_lateFees: '', payoffCltv: '',
  askingPrice: '', reservePrice: '', bidDeadline: '', preferredClosingDays: '', ndaRequired: 'false',
  dropboxLink: '', loanTapeLink: '', status: 'ACTIVE',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseOptFloat(s: string): number | undefined {
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}
function parseOptInt(s: string): number | undefined {
  const n = parseInt(s)
  return isNaN(n) ? undefined : n
}
function parseOptDate(s: string): string | undefined {
  return s ? s : undefined
}

// ── UI sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, color: 'var(--gold-300)', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)', letterSpacing: '0.04em' }}>
      {children}
    </h3>
  )
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px', marginBottom: '16px' }}>
      {children}
    </div>
  )
}

function Field({ label, required, children, error, hint }: { label: string; required?: boolean; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: 'var(--gold-400)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

function CardGroup({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px', marginBottom: '20px' }}>
      {children}
    </div>
  )
}

function CardOption({ label, sub, selected, onClick, large }: { label: string; sub?: string; selected: boolean; onClick: () => void; large?: boolean }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{
        padding: large ? '22px 20px' : '13px 16px',
        borderRadius: '8px',
        border: selected ? '1.5px solid rgba(212,168,70,0.65)' : '1px solid var(--border)',
        background: selected ? 'rgba(212,168,70,0.07)' : 'var(--bg-elevated)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        textAlign: 'center' as const,
        outline: 'none',
        userSelect: 'none' as const,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: large ? '1rem' : '0.88rem', color: selected ? 'var(--gold-300)' : 'var(--text-primary)', marginBottom: sub ? '4px' : 0 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{sub}</div>}
    </div>
  )
}

function DerivedField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: '10px 14px', background: 'rgba(212,168,70,0.05)', border: '1px solid rgba(212,168,70,0.15)', borderRadius: '6px' }}>
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: highlight ? 'var(--gold-300)' : 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CreateListingForm() {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const activeSteps = form.listingType === 'portfolio' ? PORTFOLIO_STEPS : SINGLE_STEPS
  const totalSteps = activeSteps.length
  const currentLabel = activeSteps[step - 1] ?? ''
  const isPortfolio = form.listingType === 'portfolio'

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((p) => ({ ...p, [key]: e.target.value }))
    setIsDirty(true)
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const setRaw = (key: keyof FormData) => (raw: string) => {
    setForm((p) => ({ ...p, [key]: raw }))
    setIsDirty(true)
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const pick = (key: keyof FormData, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
    setIsDirty(true)
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  // Derived values
  const dpd = useMemo(() => {
    if (!form.lastPaymentReceivedDate) return null
    const days = Math.floor((Date.now() - new Date(form.lastPaymentReceivedDate).getTime()) / 86400000)
    return Math.max(0, days)
  }, [form.lastPaymentReceivedDate])

  const fmv = parseFloat(form.fairMarketValue) || 0
  const firstBal  = parseFloat(form.firstMtg_currentBalance)  || parseFloat(form.unpaidBalance) || 0
  const secondBal = parseFloat(form.secondMtg_currentBalance) || 0
  const firstDef  = parseFloat(form.firstMtg_modDeferredBalance)  || 0
  const secondDef = parseFloat(form.secondMtg_modDeferredBalance) || 0
  const firstAccr = parseFloat(form.firstMtg_accruedInterest)   || 0
  const firstFees = parseFloat(form.firstMtg_lateFees)          || 0
  const secAccr   = parseFloat(form.secondMtg_accruedInterest)  || 0
  const secFees   = parseFloat(form.secondMtg_lateFees)         || 0

  const autoLtv = useMemo(() => {
    if (!fmv) return null
    return ((firstBal / fmv) * 100).toFixed(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstBal, fmv])

  const autoCltv = useMemo(() => {
    if (!fmv || !secondBal) return null
    return (((firstBal + secondBal) / fmv) * 100).toFixed(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstBal, secondBal, fmv])

  const autoPayoffCltv = useMemo(() => {
    if (!fmv) return null
    const firstPayoff  = firstBal  + firstAccr  + firstFees  + firstDef
    const secondPayoff = secondBal + secAccr    + secFees    + secondDef
    return (((firstPayoff + secondPayoff) / fmv) * 100).toFixed(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstBal, firstAccr, firstFees, firstDef, secondBal, secAccr, secFees, secondDef, fmv])

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}

    if (currentLabel === 'Deal Setup') {
      if (!form.listingType) e.listingType = 'Please select a listing type.'
      if (!form.assetType) e.assetType = 'Asset class is required.'
      if (!form.lienPosition) e.lienPosition = 'Lien position is required.'
      if (form.title.trim().length < 5) e.title = 'Title must be at least 5 characters.'
    }

    if (currentLabel === 'Note Terms') {
      if (!form.unpaidBalance || parseOptFloat(form.unpaidBalance) == null || parseOptFloat(form.unpaidBalance)! <= 0)
        e.unpaidBalance = 'Enter a valid UPB amount.'
      if (!form.firstMtg_interestRate || parseOptFloat(form.firstMtg_interestRate) == null)
        e.firstMtg_interestRate = 'Interest rate is required.'
      if (!form.firstMtg_originationDate) e.firstMtg_originationDate = 'Origination date is required.'
      if (!form.firstMtg_maturityDate) e.firstMtg_maturityDate = 'Maturity date is required.'
      if (!form.firstMtg_originalAmount || parseOptFloat(form.firstMtg_originalAmount) == null)
        e.firstMtg_originalAmount = 'Original loan amount is required.'
      if (!form.firstMtg_monthlyPI || parseOptFloat(form.firstMtg_monthlyPI) == null)
        e.firstMtg_monthlyPI = 'Monthly P&I is required.'
      if (!form.lastPaymentReceivedDate) e.lastPaymentReceivedDate = 'Last payment received date is required.'
    }

    if (currentLabel === 'Property') {
      if (!form.propertyState.trim()) e.propertyState = 'State is required.'
      if (!form.location.trim()) e.location = 'Location / state(s) is required.'
    }

    if (currentLabel === 'Portfolio Summary') {
      if (!form.loanCount || parseOptInt(form.loanCount) == null || parseOptInt(form.loanCount)! <= 0)
        e.loanCount = 'Enter a valid loan count.'
      if (!form.unpaidBalance || parseOptFloat(form.unpaidBalance) == null || parseOptFloat(form.unpaidBalance)! <= 0)
        e.unpaidBalance = 'Total pool UPB is required.'
      if (!form.location.trim()) e.location = 'State distribution is required.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, totalSteps)) }
  const back = () => setStep((s) => Math.max(s - 1, 1))

  // ── Payload builder ─────────────────────────────────────────────────────────

  const buildPayload = (status: 'DRAFT' | 'ACTIVE') => {
    const f = form

    // Pack portfolio stats into description
    const statsLines = isPortfolio ? [
      f.avgInterestRate && `Avg Rate: ${f.avgInterestRate}%`,
      f.avgLTV && `Avg LTV: ${f.avgLTV}%`,
      f.assetTypeMix && `Asset Mix: ${f.assetTypeMix}`,
      f.occupancyMix && `Occupancy: ${f.occupancyMix}`,
      f.pctNPL && `NPL: ${f.pctNPL}%`,
      f.pctPerforming && `Performing: ${f.pctPerforming}%`,
    ].filter(Boolean).join(' | ') : ''

    const description = [f.description.trim(), statsLines].filter(Boolean).join('\n\n') || undefined

    const listing = {
      title:               f.title.trim(),
      description,
      assetType:           f.assetType,
      unpaidBalance:       parseOptFloat(f.unpaidBalance)!,
      loanCount:           isPortfolio ? (parseOptInt(f.loanCount) ?? 1) : 1,
      location:            f.location.trim(),
      region:              f.region || undefined,
      avgDelinquency:      parseOptInt(f.avgDelinquency),
      status,
      dropboxLink:         f.dropboxLink || undefined,
      lienPosition:        (f.lienPosition === 'MIXED' || !f.lienPosition) ? undefined : f.lienPosition,
      askingPrice:         parseOptFloat(f.askingPrice),
      performanceStatus:   f.performanceStatus || undefined,
      noteType:            (!isPortfolio && f.noteType) ? f.noteType : undefined,
      listingType:         f.listingType || undefined,
      bidDeadline:         f.bidDeadline || undefined,
      reservePrice:        parseOptFloat(f.reservePrice),
      preferredClosingDays:parseOptInt(f.preferredClosingDays),
      ndaRequired:         f.ndaRequired === 'true',
    }

    if (isPortfolio) return listing

    return {
      ...listing,
      asset: {
        firstMtg_loanStatus:        f.firstMtg_loanStatus || undefined,
        firstMtg_interestRate:      parseOptFloat(f.firstMtg_interestRate) != null ? parseOptFloat(f.firstMtg_interestRate)! / 100 : undefined,
        firstMtg_originationDate:   parseOptDate(f.firstMtg_originationDate),
        firstMtg_maturityDate:      parseOptDate(f.firstMtg_maturityDate),
        firstMtg_firstPaymentDate:  parseOptDate(f.firstMtg_firstPaymentDate),
        firstMtg_originalAmount:    parseOptFloat(f.firstMtg_originalAmount),
        firstMtg_currentBalance:    parseOptFloat(f.firstMtg_currentBalance),
        firstMtg_monthlyPI:         parseOptFloat(f.firstMtg_monthlyPI),
        firstMtg_monthlyEscrow:     parseOptFloat(f.firstMtg_monthlyEscrow),
        firstMtg_nextDueDate:       parseOptDate(f.firstMtg_nextDueDate),
        firstMtg_loanTermMonths:    parseOptInt(f.firstMtg_loanTermMonths),
        firstMtg_totalMonthsPaid:   parseOptInt(f.firstMtg_totalMonthsPaid),
        firstMtg_monthsRemaining:   parseOptInt(f.firstMtg_monthsRemaining),
        firstMtg_interestPaidToDate:parseOptDate(f.firstMtg_interestPaidToDate),
        lastPaymentReceivedDate:    parseOptDate(f.lastPaymentReceivedDate),
        paymentAccepted:            f.paymentAccepted || undefined,
        isInterestOnly:             f.isInterestOnly === 'true' ? true : f.isInterestOnly === 'false' ? false : undefined,
        interestOnlyPeriod:         parseOptInt(f.interestOnlyPeriod),
        totalMonthlyPayment:        parseOptFloat(f.totalMonthlyPayment),
        propertyType:    f.propertyType || undefined,
        propertyStreet:  f.propertyStreet || undefined,
        propertyCity:    f.propertyCity || undefined,
        propertyState:   f.propertyState || undefined,
        propertyZip:     f.propertyZip || undefined,
        county:          f.county || undefined,
        yearBuilt:       parseOptInt(f.yearBuilt),
        floorSizeSqFt:   parseOptFloat(f.floorSizeSqFt),
        lotSizeSqFt:     parseOptFloat(f.lotSizeSqFt),
        bedrooms:        parseOptInt(f.bedrooms),
        bathrooms:       parseOptFloat(f.bathrooms),
        occupancyType:   f.occupancyType || undefined,
        fairMarketValue:   parseOptFloat(f.fairMarketValue),
        homePurchaseDate:  parseOptDate(f.homePurchaseDate),
        homePurchasePrice: parseOptFloat(f.homePurchasePrice),
        legalStatus:       f.legalStatus || undefined,
        isJudicialState:     f.isJudicialState === 'true' ? true : false,
        borrowerEverFiledBK: f.borrowerEverFiledBK === 'true',
        isInBankruptcy:      f.isInBankruptcy === 'true',
        bankruptcyChapter:   f.bankruptcyChapter || undefined,
        bkCaseNumber:        f.bkCaseNumber || undefined,
        bkFilingDate:        parseOptDate(f.bkFilingDate),
        ch13PocFilingDate:     parseOptDate(f.ch13PocFilingDate),
        bkConfirmationDate:    parseOptDate(f.bkConfirmationDate),
        bkDismissalDate:       parseOptDate(f.bkDismissalDate),
        ch13DischargedDate:    parseOptDate(f.ch13DischargedDate),
        ch7PetitionDate:       parseOptDate(f.ch7PetitionDate),
        ch7CaseNumber:         f.ch7CaseNumber || undefined,
        ch7DateFiled:          parseOptDate(f.ch7DateFiled),
        ch7DismissalDate:      parseOptDate(f.ch7DismissalDate),
        ch7DischargeDate:      parseOptDate(f.ch7DischargeDate),
        prevCh13PetitionDate:  parseOptDate(f.prevCh13PetitionDate),
        prevCh13CaseNumber:    f.prevCh13CaseNumber || undefined,
        prevCh13DateFiled:     parseOptDate(f.prevCh13DateFiled),
        prevCh13DismissalDate: parseOptDate(f.prevCh13DismissalDate),
        prevCh13DischargeDate: parseOptDate(f.prevCh13DischargeDate),
        firstMtg_foreclosureDefaultDate: parseOptDate(f.firstMtg_foreclosureDefaultDate),
        firstMtg_foreclosureDefaultAmt:  parseOptFloat(f.firstMtg_foreclosureDefaultAmt),
        firstMtg_foreclosureSaleDate:    parseOptDate(f.firstMtg_foreclosureSaleDate),
        secondMtg_loanStatus:       f.secondMtg_loanStatus || undefined,
        secondMtg_originationDate:  parseOptDate(f.secondMtg_originationDate),
        secondMtg_maturityDate:     parseOptDate(f.secondMtg_maturityDate),
        secondMtg_originalAmount:   parseOptFloat(f.secondMtg_originalAmount),
        secondMtg_currentBalance:   parseOptFloat(f.secondMtg_currentBalance),
        secondMtg_interestRate:     parseOptFloat(f.secondMtg_interestRate) != null ? parseOptFloat(f.secondMtg_interestRate)! / 100 : undefined,
        secondMtg_monthlyPI:        parseOptFloat(f.secondMtg_monthlyPI),
        secondMtg_nextDueDate:      parseOptDate(f.secondMtg_nextDueDate),
        secondMtg_foreclosureDefaultDate: parseOptDate(f.secondMtg_foreclosureDefaultDate),
        secondMtg_foreclosureDefaultAmt:  parseOptFloat(f.secondMtg_foreclosureDefaultAmt),
        secondMtg_foreclosureSaleDate:    parseOptDate(f.secondMtg_foreclosureSaleDate),
        firstMtg_isModified:          f.firstMtg_isModified === 'true',
        firstMtg_hasBalloon:          f.firstMtg_hasBalloon === 'true',
        firstMtg_balloonDate:         parseOptDate(f.firstMtg_balloonDate),
        firstMtg_modDate:             parseOptDate(f.firstMtg_modDate),
        firstMtg_modMaturityDate:     parseOptDate(f.firstMtg_modMaturityDate),
        firstMtg_modTermMonths:       parseOptInt(f.firstMtg_modTermMonths),
        firstMtg_modFirstPayDate:     parseOptDate(f.firstMtg_modFirstPayDate),
        firstMtg_modInterestRate:     parseOptFloat(f.firstMtg_modInterestRate) != null ? parseOptFloat(f.firstMtg_modInterestRate)! / 100 : undefined,
        firstMtg_modLoanAmount:       parseOptFloat(f.firstMtg_modLoanAmount),
        firstMtg_modCurrentBalance:   parseOptFloat(f.firstMtg_modCurrentBalance),
        firstMtg_modDeferredBalance:  parseOptFloat(f.firstMtg_modDeferredBalance),
        firstMtg_modMonthlyPI:        parseOptFloat(f.firstMtg_modMonthlyPI),
        firstMtg_modMonthlyEscrow:    parseOptFloat(f.firstMtg_modMonthlyEscrow),
        firstMtg_modMonthsPaid:       parseOptInt(f.firstMtg_modMonthsPaid),
        firstMtg_modPaymentsRemaining:parseOptInt(f.firstMtg_modPaymentsRemaining),
        secondMtg_isModified:          f.secondMtg_isModified === 'true',
        secondMtg_hasBalloon:          f.secondMtg_hasBalloon === 'true',
        secondMtg_balloonDate:         parseOptDate(f.secondMtg_balloonDate),
        secondMtg_modDate:             parseOptDate(f.secondMtg_modDate),
        secondMtg_modMaturityDate:     parseOptDate(f.secondMtg_modMaturityDate),
        secondMtg_modTermMonths:       parseOptInt(f.secondMtg_modTermMonths),
        secondMtg_modFirstPayDate:     parseOptDate(f.secondMtg_modFirstPayDate),
        secondMtg_modInterestRate:     parseOptFloat(f.secondMtg_modInterestRate) != null ? parseOptFloat(f.secondMtg_modInterestRate)! / 100 : undefined,
        secondMtg_modLoanAmount:       parseOptFloat(f.secondMtg_modLoanAmount),
        secondMtg_modCurrentBalance:   parseOptFloat(f.secondMtg_modCurrentBalance),
        secondMtg_modDeferredBalance:  parseOptFloat(f.secondMtg_modDeferredBalance),
        secondMtg_modMonthlyPI:        parseOptFloat(f.secondMtg_modMonthlyPI),
        secondMtg_modPaymentsRemaining:parseOptInt(f.secondMtg_modPaymentsRemaining),
        firstMtg_accruedInterest:  parseOptFloat(f.firstMtg_accruedInterest),
        firstMtg_lateFees:         parseOptFloat(f.firstMtg_lateFees),
        secondMtg_accruedInterest: parseOptFloat(f.secondMtg_accruedInterest),
        secondMtg_lateFees:        parseOptFloat(f.secondMtg_lateFees),
        payoffCltv:  parseOptFloat(f.payoffCltv) != null ? parseOptFloat(f.payoffCltv)! / 100 : autoPayoffCltv ? parseFloat(autoPayoffCltv) / 100 : undefined,
        ltv:   parseOptFloat(f.ltv)   != null ? parseOptFloat(f.ltv)!   / 100 : autoLtv   ? parseFloat(autoLtv)   / 100 : undefined,
        cltv:  parseOptFloat(f.cltv)  != null ? parseOptFloat(f.cltv)!  / 100 : autoCltv  ? parseFloat(autoCltv)  / 100 : undefined,
      },
    }
  }

  const submit = async (status: 'DRAFT' | 'ACTIVE') => {
    setLoading(true)
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(status)),
    })
    setLoading(false)
    const data = await res.json()
    if (!res.ok || !data.success) {
      toast.error(data.error ?? 'Failed to create listing.')
      if (data.fieldErrors) setErrors(data.fieldErrors)
      return
    }
    setIsDirty(false)
    router.push(`/listings/${data.data.id}`)
  }

  // ── UPB formatted for Review step ──────────────────────────────────────────
  const upbFormatted = form.unpaidBalance && !isNaN(parseFloat(form.unpaidBalance))
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(parseFloat(form.unpaidBalance))
    : ''

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '720px' }}>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', marginBottom: '36px', overflowX: 'auto', paddingBottom: '4px' }}>
        {activeSteps.map((label, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < activeSteps.length - 1 ? 1 : 'none', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 600, flexShrink: 0,
                  background: done ? 'var(--gold-gradient)' : active ? 'rgba(212,168,70,0.15)' : 'var(--bg-elevated)',
                  border: (done || active) ? '1px solid rgba(212,168,70,0.4)' : '1px solid var(--border-light)',
                  color: done ? '#0a0a0a' : active ? 'var(--gold-300)' : 'var(--text-muted)',
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{ fontSize: '0.62rem', color: (done || active) ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
              {i < activeSteps.length - 1 && (
                <div style={{ flex: 1, height: '1px', background: done ? 'rgba(212,168,70,0.3)' : 'var(--border)', margin: '0 4px', marginBottom: '18px', minWidth: '8px' }} />
              )}
            </div>
          )
        })}
      </div>

      <div className="glass-card" style={{ padding: '36px' }}>

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Deal Setup
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Deal Setup' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '8px' }}>Deal Setup</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Tell us what you&apos;re selling. Your answers here shape the rest of the form.
            </p>

            {/* Listing Type */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                What are you listing?<span style={{ color: 'var(--gold-400)', marginLeft: '3px' }}>*</span>
              </div>
              <CardGroup cols={2}>
                <CardOption
                  large
                  label="Single Loan"
                  sub="One note secured by one property"
                  selected={form.listingType === 'single'}
                  onClick={() => pick('listingType', 'single')}
                />
                <CardOption
                  large
                  label="Loan Portfolio"
                  sub="Multiple notes bundled together"
                  selected={form.listingType === 'portfolio'}
                  onClick={() => pick('listingType', 'portfolio')}
                />
              </CardGroup>
              {errors.listingType && <span className="form-error">{errors.listingType}</span>}
            </div>

            {/* Performance Status */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '10px' }}>Performance Status</div>
              <CardGroup cols={4}>
                {[
                  { val: 'PERFORMING',     label: 'Performing / Mod', sub: 'Current or modified' },
                  { val: 'SUB_PERFORMING', label: 'Sub-Performing',   sub: '< 60 DPD' },
                  { val: 'BK_PERFORMING',  label: 'BK Performing',    sub: 'Ch. 13 current' },
                  { val: 'NON_PERFORMING', label: 'Non-Performing',   sub: '60+ DPD' },
                ].map(({ val, label, sub }) => (
                  <CardOption key={val} label={label} sub={sub} selected={form.performanceStatus === val} onClick={() => pick('performanceStatus', val)} />
                ))}
              </CardGroup>
            </div>

            {/* Asset Class */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Asset Class<span style={{ color: 'var(--gold-400)', marginLeft: '3px' }}>*</span>
              </div>
              <CardGroup cols={2}>
                <CardOption
                  label="Residential 1–4 Units"
                  sub="SFR, condo, duplex, tri/quad-plex"
                  selected={form.assetType === 'RESIDENTIAL'}
                  onClick={() => pick('assetType', 'RESIDENTIAL')}
                />
                <CardOption
                  label="Commercial"
                  sub="Mixed-use, retail, multifamily 5+, industrial"
                  selected={form.assetType === 'COMMERCIAL'}
                  onClick={() => pick('assetType', 'COMMERCIAL')}
                />
              </CardGroup>
              {errors.assetType && <span className="form-error">{errors.assetType}</span>}
            </div>

            {/* Lien Position */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Lien Position<span style={{ color: 'var(--gold-400)', marginLeft: '3px' }}>*</span>
              </div>
              <CardGroup cols={isPortfolio ? 3 : 2}>
                <CardOption label="First / Senior" sub="1st Mortgage" selected={form.lienPosition === 'SENIOR'} onClick={() => pick('lienPosition', 'SENIOR')} />
                <CardOption label="Second / Junior" sub="2nd Mortgage / HELOC" selected={form.lienPosition === 'JUNIOR'} onClick={() => pick('lienPosition', 'JUNIOR')} />
                {isPortfolio && (
                  <CardOption label="Mixed" sub="Combination of positions" selected={form.lienPosition === 'MIXED'} onClick={() => pick('lienPosition', 'MIXED')} />
                )}
              </CardGroup>
              {errors.lienPosition && <span className="form-error">{errors.lienPosition}</span>}
            </div>

            {/* Note Type — single loan only */}
            {!isPortfolio && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '10px' }}>Note Type</div>
                <CardGroup cols={4}>
                  {[
                    { val: 'FIXED',   label: 'Fixed Rate' },
                    { val: 'ARM',     label: 'ARM' },
                    { val: 'IO',      label: 'Interest Only' },
                    { val: 'BALLOON', label: 'Balloon' },
                  ].map(({ val, label }) => (
                    <CardOption key={val} label={label} selected={form.noteType === val} onClick={() => pick('noteType', val)} />
                  ))}
                </CardGroup>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '4px' }}>
              <Field label="Listing Title" required error={errors.title}>
                <input
                  type="text"
                  className={`form-input${errors.title ? ' form-input--error' : ''}`}
                  placeholder={isPortfolio ? 'e.g. Southeast Residential NPL Portfolio — 45 Loans' : 'e.g. Chicago IL Non-Performing 1st Mortgage — SFR'}
                  value={form.title}
                  onChange={set('title')}
                />
              </Field>
              <div style={{ marginBottom: '16px' }} />
              <Field label="Description" hint="Optional. Visible to buyers on the listing page.">
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={isPortfolio ? 'Describe the portfolio — collateral mix, geography, servicing history…' : 'Describe the note — property condition, borrower history, servicing notes…'}
                  value={form.description}
                  onChange={set('description')}
                  style={{ resize: 'vertical' }}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Note Terms (single loan)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Note Terms' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Note Terms</h2>

            <SectionTitle>Loan Balances</SectionTitle>
            <FieldRow cols={2}>
              <Field label="UPB — Unpaid Principal Balance" required error={errors.unpaidBalance}>
                <CurrencyInput
                  className={`form-input${errors.unpaidBalance ? ' form-input--error' : ''}`}
                  placeholder="e.g. $185,000.00"
                  value={form.unpaidBalance}
                  onValueChange={setRaw('unpaidBalance')}
                />
              </Field>
              <Field label="Original Loan Amount" required error={errors.firstMtg_originalAmount}>
                <CurrencyInput
                  className={`form-input${errors.firstMtg_originalAmount ? ' form-input--error' : ''}`}
                  placeholder="e.g. $200,000.00"
                  value={form.firstMtg_originalAmount}
                  onValueChange={setRaw('firstMtg_originalAmount')}
                />
              </Field>
            </FieldRow>
            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Rate &amp; Payments</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Interest Rate (%)" required error={errors.firstMtg_interestRate}>
                <PercentInput
                  className={`form-input${errors.firstMtg_interestRate ? ' form-input--error' : ''}`}
                  placeholder="e.g. 8.5%"
                  value={form.firstMtg_interestRate}
                  onValueChange={setRaw('firstMtg_interestRate')}
                />
              </Field>
              <Field label="Monthly P&amp;I" required error={errors.firstMtg_monthlyPI}>
                <CurrencyInput
                  className={`form-input${errors.firstMtg_monthlyPI ? ' form-input--error' : ''}`}
                  placeholder="e.g. $1,450.00"
                  value={form.firstMtg_monthlyPI}
                  onValueChange={setRaw('firstMtg_monthlyPI')}
                />
              </Field>
            </FieldRow>
            <FieldRow cols={3}>
              <Field label="Monthly Escrow">
                <CurrencyInput placeholder="e.g. $350.00" value={form.firstMtg_monthlyEscrow} onValueChange={setRaw('firstMtg_monthlyEscrow')} />
              </Field>
              <Field label="Total Monthly Payment">
                <CurrencyInput placeholder="e.g. $1,800.00" value={form.totalMonthlyPayment} onValueChange={setRaw('totalMonthlyPayment')} />
              </Field>
              <Field label="Interest Only?">
                <select className="form-input" value={form.isInterestOnly} onChange={set('isInterestOnly')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </Field>
            </FieldRow>
            {form.isInterestOnly === 'true' && (
              <Field label="I/O Period (months)">
                <input type="number" min="0" className="form-input" placeholder="e.g. 60" value={form.interestOnlyPeriod} onChange={set('interestOnlyPeriod')} />
              </Field>
            )}

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Loan Dates</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Origination Date" required error={errors.firstMtg_originationDate}>
                <input type="date" className={`form-input${errors.firstMtg_originationDate ? ' form-input--error' : ''}`} value={form.firstMtg_originationDate} onChange={set('firstMtg_originationDate')} />
              </Field>
              <Field label="Maturity Date" required error={errors.firstMtg_maturityDate}>
                <input type="date" className={`form-input${errors.firstMtg_maturityDate ? ' form-input--error' : ''}`} value={form.firstMtg_maturityDate} onChange={set('firstMtg_maturityDate')} />
              </Field>
            </FieldRow>
            <FieldRow cols={2}>
              <Field label="First Payment Date">
                <input type="date" className="form-input" value={form.firstMtg_firstPaymentDate} onChange={set('firstMtg_firstPaymentDate')} />
              </Field>
              <Field label="Next Due Date">
                <input type="date" className="form-input" value={form.firstMtg_nextDueDate} onChange={set('firstMtg_nextDueDate')} />
              </Field>
            </FieldRow>
            <FieldRow cols={2}>
              <Field label="Last Payment Received" required error={errors.lastPaymentReceivedDate}>
                <input type="date" className={`form-input${errors.lastPaymentReceivedDate ? ' form-input--error' : ''}`} value={form.lastPaymentReceivedDate} onChange={set('lastPaymentReceivedDate')} />
              </Field>
              <Field label="Interest Paid To Date">
                <input type="date" className="form-input" value={form.firstMtg_interestPaidToDate} onChange={set('firstMtg_interestPaidToDate')} />
              </Field>
            </FieldRow>

            {dpd !== null && (
              <div style={{ marginBottom: '16px' }}>
                <DerivedField
                  label="Days Past Due (calculated)"
                  value={`${dpd} day${dpd === 1 ? '' : 's'}`}
                  highlight={dpd >= 90}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Loan Status &amp; Terms</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Loan Status">
                <select className="form-input" value={form.firstMtg_loanStatus} onChange={set('firstMtg_loanStatus')}>
                  <option value="Performing">Performing</option>
                  <option value="Sub-Performing">Sub-Performing</option>
                  <option value="BK 13 Performing">BK 13 Performing</option>
                  <option value="Non-Performing">Non-Performing</option>
                  <option value="Performing / Modified">Performing / Modified</option>
                  <option value="Default">Default</option>
                  <option value="Foreclosure">Foreclosure</option>
                </select>
              </Field>
              <Field label="Payment Accepted">
                <input type="text" className="form-input" placeholder="e.g. ACH, Wire Transfer" value={form.paymentAccepted} onChange={set('paymentAccepted')} />
              </Field>
            </FieldRow>
            <FieldRow cols={3}>
              <Field label="Loan Term (months)">
                <input type="number" min="0" className="form-input" placeholder="e.g. 360" value={form.firstMtg_loanTermMonths} onChange={set('firstMtg_loanTermMonths')} />
              </Field>
              <Field label="Months Paid">
                <input type="number" min="0" className="form-input" placeholder="e.g. 48" value={form.firstMtg_totalMonthsPaid} onChange={set('firstMtg_totalMonthsPaid')} />
              </Field>
              <Field label="Months Remaining">
                <input type="number" min="0" className="form-input" placeholder="e.g. 312" value={form.firstMtg_monthsRemaining} onChange={set('firstMtg_monthsRemaining')} />
              </Field>
            </FieldRow>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Property (single loan)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Property' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Property Details</h2>

            <SectionTitle>Property Type &amp; Address</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Property Type">
                <select className="form-input" value={form.propertyType} onChange={set('propertyType')}>
                  <option value="SFR">Single-Family Residence (SFR)</option>
                  <option value="CONDO">Condo</option>
                  <option value="MULTI">Multi-Family</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="LAND">Land</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Occupancy Type">
                <select className="form-input" value={form.occupancyType} onChange={set('occupancyType')}>
                  <option value="">Select…</option>
                  <option value="Owner Occupied">Owner Occupied</option>
                  <option value="Non-Owner Occupied">Non-Owner Occupied</option>
                  <option value="Vacant">Vacant</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </Field>
            </FieldRow>
            <Field label="Street Address">
              <input type="text" className="form-input" placeholder="123 Main St" value={form.propertyStreet} onChange={set('propertyStreet')} />
            </Field>
            <FieldRow cols={3}>
              <Field label="City">
                <input type="text" className="form-input" placeholder="Miami" value={form.propertyCity} onChange={set('propertyCity')} />
              </Field>
              <Field label="State" required error={errors.propertyState}>
                <input type="text" className={`form-input${errors.propertyState ? ' form-input--error' : ''}`} placeholder="FL" maxLength={2} value={form.propertyState} onChange={set('propertyState')} />
              </Field>
              <Field label="Zip">
                <input type="text" className="form-input" placeholder="33101" maxLength={10} value={form.propertyZip} onChange={set('propertyZip')} />
              </Field>
            </FieldRow>
            <FieldRow cols={2}>
              <Field label="County">
                <input type="text" className="form-input" placeholder="Miami-Dade" value={form.county} onChange={set('county')} />
              </Field>
              <Field label="Region">
                <select className="form-input" value={form.region} onChange={set('region')}>
                  <option value="">Select region…</option>
                  <option value="Northeast">Northeast</option>
                  <option value="Southeast">Southeast</option>
                  <option value="Midwest">Midwest</option>
                  <option value="West">West</option>
                  <option value="Southwest">Southwest</option>
                  <option value="Nationwide">Nationwide</option>
                </select>
              </Field>
            </FieldRow>
            <Field label="Location / State(s) for Search" required error={errors.location} hint="Used for filtering. Use state abbreviations, e.g. FL or FL, GA, SC.">
              <input type="text" className={`form-input${errors.location ? ' form-input--error' : ''}`} placeholder="e.g. FL" value={form.location} onChange={set('location')} />
            </Field>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Property Characteristics</SectionTitle>
            <FieldRow cols={4}>
              <Field label="Year Built">
                <input type="number" min="1800" max="2030" className="form-input" placeholder="1998" value={form.yearBuilt} onChange={set('yearBuilt')} />
              </Field>
              <Field label="Sq Ft (Living)">
                <input type="number" min="0" className="form-input" placeholder="1850" value={form.floorSizeSqFt} onChange={set('floorSizeSqFt')} />
              </Field>
              <Field label="Bedrooms">
                <input type="number" min="0" className="form-input" placeholder="3" value={form.bedrooms} onChange={set('bedrooms')} />
              </Field>
              <Field label="Bathrooms">
                <input type="number" min="0" step="0.5" className="form-input" placeholder="2" value={form.bathrooms} onChange={set('bathrooms')} />
              </Field>
            </FieldRow>
            <Field label="Lot Size (Sq Ft)">
              <input type="number" min="0" className="form-input" placeholder="8500" value={form.lotSizeSqFt} onChange={set('lotSizeSqFt')} />
            </Field>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Valuation</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Fair Market Value (FMV)" required hint="Required for LTV / CLTV calculations">
                <CurrencyInput placeholder="e.g. $250,000.00" value={form.fairMarketValue} onValueChange={setRaw('fairMarketValue')} />
              </Field>
              <Field label="Home Purchase Price">
                <CurrencyInput placeholder="e.g. $220,000.00" value={form.homePurchasePrice} onValueChange={setRaw('homePurchasePrice')} />
              </Field>
            </FieldRow>
            <Field label="Purchase Date">
              <input type="date" className="form-input" value={form.homePurchaseDate} onChange={set('homePurchaseDate')} />
            </Field>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Payoff Components (for Payoff CLTV)</SectionTitle>
            <FieldRow cols={2}>
              <Field label="1st — Accrued Interest">
                <CurrencyInput placeholder="e.g. $4,200.00" value={form.firstMtg_accruedInterest} onValueChange={setRaw('firstMtg_accruedInterest')} />
              </Field>
              <Field label="1st — Late Fees">
                <CurrencyInput placeholder="e.g. $850.00" value={form.firstMtg_lateFees} onValueChange={setRaw('firstMtg_lateFees')} />
              </Field>
            </FieldRow>
            <FieldRow cols={2}>
              <Field label="2nd — Accrued Interest">
                <CurrencyInput placeholder="e.g. $1,100.00" value={form.secondMtg_accruedInterest} onValueChange={setRaw('secondMtg_accruedInterest')} />
              </Field>
              <Field label="2nd — Late Fees">
                <CurrencyInput placeholder="e.g. $250.00" value={form.secondMtg_lateFees} onValueChange={setRaw('secondMtg_lateFees')} />
              </Field>
            </FieldRow>

            {/* Auto-calculated metrics */}
            {fmv > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
                <DerivedField label="LTV (1st ÷ FMV)" value={autoLtv ? `${autoLtv}%` : '—'} highlight={!!autoLtv} />
                <DerivedField label="CLTV ((1st + 2nd) ÷ FMV)" value={autoCltv ? `${autoCltv}%` : secondBal ? `${autoLtv ?? '—'}%` : '—'} highlight={!!autoCltv} />
                <DerivedField label="Payoff CLTV (incl. fees)" value={autoPayoffCltv ? `${autoPayoffCltv}%` : '—'} highlight={!!autoPayoffCltv} />
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Legal & Status (single loan — replaces old BK + FC + Mods steps)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Legal & Status' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '8px' }}>Legal &amp; Status</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Only fill in sections that apply. Leave everything blank if the loan is clear of legal proceedings.
            </p>

            {/* Legal Overview */}
            <SectionTitle>Legal Overview</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Legal Status">
                <select className="form-input" value={form.legalStatus} onChange={set('legalStatus')}>
                  <option value="">Clear — No Active Proceedings</option>
                  <option value="Pre-Foreclosure">Pre-Foreclosure</option>
                  <option value="Foreclosure Filed">Foreclosure Filed</option>
                  <option value="Foreclosure — Suspended">Foreclosure — Suspended</option>
                  <option value="REO">REO</option>
                  <option value="Bankruptcy Stay">Bankruptcy Stay</option>
                </select>
              </Field>
              <Field label="Judicial State?">
                <select className="form-input" value={form.isJudicialState} onChange={set('isJudicialState')}>
                  <option value="false">No (Non-Judicial)</option>
                  <option value="true">Yes (Judicial)</option>
                </select>
              </Field>
            </FieldRow>

            {/* Bankruptcy — gated by "ever filed?" */}
            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Bankruptcy</SectionTitle>
            <Field label="Has the borrower ever filed bankruptcy?">
              <select className="form-input" value={form.borrowerEverFiledBK} onChange={set('borrowerEverFiledBK')}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </Field>

            {form.borrowerEverFiledBK === 'true' && (
              <>
                <div style={{ marginTop: '16px' }} />
                <FieldRow cols={2}>
                  <Field label="Is loan currently in Bankruptcy?">
                    <select className="form-input" value={form.isInBankruptcy} onChange={set('isInBankruptcy')}>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </Field>
                  {form.isInBankruptcy === 'true' && (
                    <Field label="Chapter">
                      <select className="form-input" value={form.bankruptcyChapter} onChange={set('bankruptcyChapter')}>
                        <option value="">Select…</option>
                        <option value="7">Chapter 7</option>
                        <option value="11">Chapter 11</option>
                        <option value="13">Chapter 13</option>
                      </select>
                    </Field>
                  )}
                </FieldRow>

                {form.isInBankruptcy === 'true' && (
                  <>
                    <FieldRow cols={2}>
                      <Field label="BK Case Number">
                        <input type="text" className="form-input" placeholder="e.g. 25-01234" value={form.bkCaseNumber} onChange={set('bkCaseNumber')} />
                      </Field>
                      <Field label="BK Filing Date">
                        <input type="date" className="form-input" value={form.bkFilingDate} onChange={set('bkFilingDate')} />
                      </Field>
                    </FieldRow>
                    <FieldRow cols={2}>
                      <Field label="Confirmation Date">
                        <input type="date" className="form-input" value={form.bkConfirmationDate} onChange={set('bkConfirmationDate')} />
                      </Field>
                      <Field label="Ch.13 POC Filing Date">
                        <input type="date" className="form-input" value={form.ch13PocFilingDate} onChange={set('ch13PocFilingDate')} />
                      </Field>
                    </FieldRow>
                    <FieldRow cols={2}>
                      <Field label="Dismissal Date">
                        <input type="date" className="form-input" value={form.bkDismissalDate} onChange={set('bkDismissalDate')} />
                      </Field>
                      <Field label="Ch.13 Discharged Date">
                        <input type="date" className="form-input" value={form.ch13DischargedDate} onChange={set('ch13DischargedDate')} />
                      </Field>
                    </FieldRow>
                  </>
                )}

                {/* Prior BK History — always shown if borrower ever filed */}
                <div style={{ margin: '16px 0 12px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Prior BK History — Ch. 7
                </div>
                <FieldRow cols={2}>
                  <Field label="Petition Date">
                    <input type="date" className="form-input" value={form.ch7PetitionDate} onChange={set('ch7PetitionDate')} />
                  </Field>
                  <Field label="Case Number">
                    <input type="text" className="form-input" placeholder="e.g. 24-12345" value={form.ch7CaseNumber} onChange={set('ch7CaseNumber')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={3}>
                  <Field label="Date Filed">
                    <input type="date" className="form-input" value={form.ch7DateFiled} onChange={set('ch7DateFiled')} />
                  </Field>
                  <Field label="Dismissal Date">
                    <input type="date" className="form-input" value={form.ch7DismissalDate} onChange={set('ch7DismissalDate')} />
                  </Field>
                  <Field label="Discharge Date">
                    <input type="date" className="form-input" value={form.ch7DischargeDate} onChange={set('ch7DischargeDate')} />
                  </Field>
                </FieldRow>

                <div style={{ margin: '16px 0 12px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Prior BK History — Ch. 13
                </div>
                <FieldRow cols={2}>
                  <Field label="Petition Date">
                    <input type="date" className="form-input" value={form.prevCh13PetitionDate} onChange={set('prevCh13PetitionDate')} />
                  </Field>
                  <Field label="Case Number">
                    <input type="text" className="form-input" placeholder="e.g. 23-67890" value={form.prevCh13CaseNumber} onChange={set('prevCh13CaseNumber')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={3}>
                  <Field label="Date Filed">
                    <input type="date" className="form-input" value={form.prevCh13DateFiled} onChange={set('prevCh13DateFiled')} />
                  </Field>
                  <Field label="Dismissal Date">
                    <input type="date" className="form-input" value={form.prevCh13DismissalDate} onChange={set('prevCh13DismissalDate')} />
                  </Field>
                  <Field label="Discharge Date">
                    <input type="date" className="form-input" value={form.prevCh13DischargeDate} onChange={set('prevCh13DischargeDate')} />
                  </Field>
                </FieldRow>
              </>
            )}

            {/* Foreclosure */}
            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>1st Mortgage — Foreclosure</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Default Date">
                <input type="date" className="form-input" value={form.firstMtg_foreclosureDefaultDate} onChange={set('firstMtg_foreclosureDefaultDate')} />
              </Field>
              <Field label="Default Amount">
                <CurrencyInput placeholder="e.g. $24,500.00" value={form.firstMtg_foreclosureDefaultAmt} onValueChange={setRaw('firstMtg_foreclosureDefaultAmt')} />
              </Field>
            </FieldRow>
            <Field label="Foreclosure Sale Date">
              <input type="date" className="form-input" value={form.firstMtg_foreclosureSaleDate} onChange={set('firstMtg_foreclosureSaleDate')} />
            </Field>

            {/* 2nd Mortgage */}
            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>2nd Mortgage (if applicable)</SectionTitle>
            <FieldRow cols={2}>
              <Field label="2nd Loan Status">
                <select className="form-input" value={form.secondMtg_loanStatus} onChange={set('secondMtg_loanStatus')}>
                  <option value="">N/A — No 2nd Mortgage</option>
                  <option value="Non-Performing">Non-Performing</option>
                  <option value="Re-Performing">Re-Performing</option>
                  <option value="Current">Current</option>
                  <option value="Charged Off">Charged Off</option>
                </select>
              </Field>
              <Field label="Interest Rate (%)">
                <PercentInput placeholder="e.g. 10.5%" value={form.secondMtg_interestRate} onValueChange={setRaw('secondMtg_interestRate')} />
              </Field>
            </FieldRow>

            {form.secondMtg_loanStatus && (
              <>
                <FieldRow cols={2}>
                  <Field label="Original Amount">
                    <CurrencyInput placeholder="e.g. $45,000.00" value={form.secondMtg_originalAmount} onValueChange={setRaw('secondMtg_originalAmount')} />
                  </Field>
                  <Field label="Current Balance">
                    <CurrencyInput placeholder="e.g. $38,000.00" value={form.secondMtg_currentBalance} onValueChange={setRaw('secondMtg_currentBalance')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={2}>
                  <Field label="Monthly P&amp;I">
                    <CurrencyInput placeholder="e.g. $480.00" value={form.secondMtg_monthlyPI} onValueChange={setRaw('secondMtg_monthlyPI')} />
                  </Field>
                  <Field label="Next Due Date">
                    <input type="date" className="form-input" value={form.secondMtg_nextDueDate} onChange={set('secondMtg_nextDueDate')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={2}>
                  <Field label="Origination Date">
                    <input type="date" className="form-input" value={form.secondMtg_originationDate} onChange={set('secondMtg_originationDate')} />
                  </Field>
                  <Field label="Maturity Date">
                    <input type="date" className="form-input" value={form.secondMtg_maturityDate} onChange={set('secondMtg_maturityDate')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={2}>
                  <Field label="2nd FC Default Date">
                    <input type="date" className="form-input" value={form.secondMtg_foreclosureDefaultDate} onChange={set('secondMtg_foreclosureDefaultDate')} />
                  </Field>
                  <Field label="2nd FC Default Amount">
                    <CurrencyInput placeholder="e.g. $8,000.00" value={form.secondMtg_foreclosureDefaultAmt} onValueChange={setRaw('secondMtg_foreclosureDefaultAmt')} />
                  </Field>
                </FieldRow>
                <Field label="2nd FC Sale Date">
                  <input type="date" className="form-input" value={form.secondMtg_foreclosureSaleDate} onChange={set('secondMtg_foreclosureSaleDate')} />
                </Field>
              </>
            )}

            {/* Modifications */}
            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Loan Modifications</SectionTitle>
            <FieldRow cols={2}>
              <Field label="1st Mortgage Modified?">
                <select className="form-input" value={form.firstMtg_isModified} onChange={set('firstMtg_isModified')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </Field>
              {form.firstMtg_isModified === 'true' && (
                <Field label="Has Balloon Payment?">
                  <select className="form-input" value={form.firstMtg_hasBalloon} onChange={set('firstMtg_hasBalloon')}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </Field>
              )}
            </FieldRow>

            {form.firstMtg_isModified === 'true' && (
              <>
                {form.firstMtg_hasBalloon === 'true' && (
                  <Field label="Balloon Date">
                    <input type="date" className="form-input" value={form.firstMtg_balloonDate} onChange={set('firstMtg_balloonDate')} />
                  </Field>
                )}
                <FieldRow cols={2}>
                  <Field label="Modification Date">
                    <input type="date" className="form-input" value={form.firstMtg_modDate} onChange={set('firstMtg_modDate')} />
                  </Field>
                  <Field label="Mod Maturity Date">
                    <input type="date" className="form-input" value={form.firstMtg_modMaturityDate} onChange={set('firstMtg_modMaturityDate')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={2}>
                  <Field label="Mod Loan Amount">
                    <CurrencyInput value={form.firstMtg_modLoanAmount} onValueChange={setRaw('firstMtg_modLoanAmount')} />
                  </Field>
                  <Field label="Mod Current Balance">
                    <CurrencyInput value={form.firstMtg_modCurrentBalance} onValueChange={setRaw('firstMtg_modCurrentBalance')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={3}>
                  <Field label="Deferred Balance">
                    <CurrencyInput value={form.firstMtg_modDeferredBalance} onValueChange={setRaw('firstMtg_modDeferredBalance')} />
                  </Field>
                  <Field label="Mod Interest Rate (%)">
                    <PercentInput value={form.firstMtg_modInterestRate} onValueChange={setRaw('firstMtg_modInterestRate')} />
                  </Field>
                  <Field label="Mod Monthly P&amp;I">
                    <CurrencyInput value={form.firstMtg_modMonthlyPI} onValueChange={setRaw('firstMtg_modMonthlyPI')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={3}>
                  <Field label="Mod Term (months)">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modTermMonths} onChange={set('firstMtg_modTermMonths')} />
                  </Field>
                  <Field label="Mod Monthly Escrow">
                    <CurrencyInput value={form.firstMtg_modMonthlyEscrow} onValueChange={setRaw('firstMtg_modMonthlyEscrow')} />
                  </Field>
                  <Field label="Payments Remaining">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modPaymentsRemaining} onChange={set('firstMtg_modPaymentsRemaining')} />
                  </Field>
                </FieldRow>
              </>
            )}

            {form.secondMtg_loanStatus && (
              <>
                <div style={{ marginBottom: '8px' }} />
                <FieldRow cols={2}>
                  <Field label="2nd Mortgage Modified?">
                    <select className="form-input" value={form.secondMtg_isModified} onChange={set('secondMtg_isModified')}>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </Field>
                  {form.secondMtg_isModified === 'true' && (
                    <Field label="Has Balloon?">
                      <select className="form-input" value={form.secondMtg_hasBalloon} onChange={set('secondMtg_hasBalloon')}>
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </Field>
                  )}
                </FieldRow>
                {form.secondMtg_isModified === 'true' && (
                  <>
                    {form.secondMtg_hasBalloon === 'true' && (
                      <Field label="2nd Balloon Date">
                        <input type="date" className="form-input" value={form.secondMtg_balloonDate} onChange={set('secondMtg_balloonDate')} />
                      </Field>
                    )}
                    <FieldRow cols={2}>
                      <Field label="Modification Date">
                        <input type="date" className="form-input" value={form.secondMtg_modDate} onChange={set('secondMtg_modDate')} />
                      </Field>
                      <Field label="Mod Maturity Date">
                        <input type="date" className="form-input" value={form.secondMtg_modMaturityDate} onChange={set('secondMtg_modMaturityDate')} />
                      </Field>
                    </FieldRow>
                    <FieldRow cols={2}>
                      <Field label="Mod Loan Amount">
                        <CurrencyInput value={form.secondMtg_modLoanAmount} onValueChange={setRaw('secondMtg_modLoanAmount')} />
                      </Field>
                      <Field label="Mod Current Balance">
                        <CurrencyInput value={form.secondMtg_modCurrentBalance} onValueChange={setRaw('secondMtg_modCurrentBalance')} />
                      </Field>
                    </FieldRow>
                    <FieldRow cols={3}>
                      <Field label="Deferred Balance">
                        <CurrencyInput value={form.secondMtg_modDeferredBalance} onValueChange={setRaw('secondMtg_modDeferredBalance')} />
                      </Field>
                      <Field label="Mod Interest Rate (%)">
                        <PercentInput value={form.secondMtg_modInterestRate} onValueChange={setRaw('secondMtg_modInterestRate')} />
                      </Field>
                      <Field label="Mod Monthly P&amp;I">
                        <CurrencyInput value={form.secondMtg_modMonthlyPI} onValueChange={setRaw('secondMtg_modMonthlyPI')} />
                      </Field>
                    </FieldRow>
                    <FieldRow cols={2}>
                      <Field label="Mod Term (months)">
                        <input type="number" min="0" className="form-input" value={form.secondMtg_modTermMonths} onChange={set('secondMtg_modTermMonths')} />
                      </Field>
                      <Field label="Payments Remaining">
                        <input type="number" min="0" className="form-input" value={form.secondMtg_modPaymentsRemaining} onChange={set('secondMtg_modPaymentsRemaining')} />
                      </Field>
                    </FieldRow>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Portfolio Summary
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Portfolio Summary' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Portfolio Summary</h2>

            <SectionTitle>Pool Size</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Number of Loans" required error={errors.loanCount}>
                <input type="number" min="1" className={`form-input${errors.loanCount ? ' form-input--error' : ''}`} placeholder="e.g. 45" value={form.loanCount} onChange={set('loanCount')} />
              </Field>
              <Field label="Total Pool UPB" required error={errors.unpaidBalance}>
                <CurrencyInput
                  className={`form-input${errors.unpaidBalance ? ' form-input--error' : ''}`}
                  placeholder="e.g. $8,250,000.00"
                  value={form.unpaidBalance}
                  onValueChange={setRaw('unpaidBalance')}
                />
              </Field>
            </FieldRow>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Averages</SectionTitle>
            <FieldRow cols={3}>
              <Field label="Avg Interest Rate (%)">
                <PercentInput placeholder="e.g. 7.25%" value={form.avgInterestRate} onValueChange={setRaw('avgInterestRate')} />
              </Field>
              <Field label="Avg LTV (%)">
                <PercentInput placeholder="e.g. 88.0%" value={form.avgLTV} onValueChange={setRaw('avgLTV')} />
              </Field>
              <Field label="Avg Delinquency (months)">
                <input type="number" min="0" className="form-input" placeholder="e.g. 18" value={form.avgDelinquency} onChange={set('avgDelinquency')} />
              </Field>
            </FieldRow>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Geography</SectionTitle>
            <Field label="State Distribution" required error={errors.location} hint="Used for search and filtering. Enter states and approximate percentages.">
              <input type="text" className={`form-input${errors.location ? ' form-input--error' : ''}`} placeholder="e.g. FL 40%, GA 30%, SC 20%, NC 10%" value={form.location} onChange={set('location')} />
            </Field>
            <div style={{ marginBottom: '16px' }} />
            <Field label="Region">
              <select className="form-input" value={form.region} onChange={set('region')}>
                <option value="">Select primary region…</option>
                <option value="Northeast">Northeast</option>
                <option value="Southeast">Southeast</option>
                <option value="Midwest">Midwest</option>
                <option value="West">West</option>
                <option value="Southwest">Southwest</option>
                <option value="Nationwide">Nationwide</option>
              </select>
            </Field>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Collateral Overview (portfolio)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Collateral Overview' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '8px' }}>Collateral Overview</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '24px' }}>All fields optional — provide what you can to attract better bids.</p>

            <SectionTitle>Collateral Composition</SectionTitle>
            <Field label="Asset Type Mix" hint="e.g. 70% SFR, 20% Condo, 10% Multi-Family">
              <input type="text" className="form-input" placeholder="e.g. 70% SFR, 20% Condo, 10% Multi-Family" value={form.assetTypeMix} onChange={set('assetTypeMix')} />
            </Field>
            <div style={{ marginBottom: '16px' }} />
            <Field label="Occupancy Mix" hint="e.g. 60% Owner Occupied, 30% Non-Owner, 10% Vacant">
              <input type="text" className="form-input" placeholder="e.g. 60% Owner Occupied, 30% Non-Owner, 10% Vacant" value={form.occupancyMix} onChange={set('occupancyMix')} />
            </Field>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Performance Stratification</SectionTitle>
            <FieldRow cols={2}>
              <Field label="% Non-Performing (NPL)">
                <PercentInput placeholder="e.g. 75%" value={form.pctNPL} onValueChange={setRaw('pctNPL')} />
              </Field>
              <Field label="% Performing / Re-Performing">
                <PercentInput placeholder="e.g. 25%" value={form.pctPerforming} onValueChange={setRaw('pctPerforming')} />
              </Field>
            </FieldRow>
            {form.pctNPL && form.pctPerforming && (
              <DerivedField
                label="Sub-Performing (derived)"
                value={`${Math.max(0, 100 - parseFloat(form.pctNPL || '0') - parseFloat(form.pctPerforming || '0')).toFixed(1)}%`}
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Deal Terms (both paths)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Deal Terms' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '8px' }}>Deal Terms</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Set your pricing and closing expectations. Buyers will see these details on the listing.
            </p>

            <SectionTitle>Pricing</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Asking Price (USD)" hint="The price you are marketing this at.">
                <CurrencyInput placeholder="e.g. $125,000.00" value={form.askingPrice} onValueChange={setRaw('askingPrice')} />
              </Field>
              <Field label="Reserve / Minimum Bid (USD)" hint="Lowest bid you will consider. Not shown to buyers.">
                <CurrencyInput placeholder="e.g. $95,000.00" value={form.reservePrice} onValueChange={setRaw('reservePrice')} />
              </Field>
            </FieldRow>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Timeline</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Bid Deadline" hint="Last date to receive bids.">
                <input type="date" className="form-input" value={form.bidDeadline} onChange={set('bidDeadline')} />
              </Field>
              <Field label="Preferred Closing Timeline">
                <select className="form-input" value={form.preferredClosingDays} onChange={set('preferredClosingDays')}>
                  <option value="">No preference</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                  <option value="45">45 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </Field>
            </FieldRow>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Requirements</SectionTitle>
            <FieldRow cols={2}>
              <Field label="NDA Required?" hint="Buyers must sign an NDA to access documents.">
                <select className="form-input" value={form.ndaRequired} onChange={set('ndaRequired')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </Field>
              <Field label="Accepted Payment Methods">
                <input type="text" className="form-input" placeholder="e.g. ACH, Wire Transfer" value={form.paymentAccepted} onChange={set('paymentAccepted')} />
              </Field>
            </FieldRow>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Documents
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Documents' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '8px' }}>Documents</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Links are only shared with buyers whose bids you accept.
            </p>

            <Field label="Document Vault Link (Dropbox / Google Drive)" hint="Diligence docs, title report, inspection, servicing notes, etc.">
              <input type="url" className="form-input" placeholder="https://www.dropbox.com/…" value={form.dropboxLink} onChange={set('dropboxLink')} />
            </Field>

            {isPortfolio && (
              <>
                <div style={{ marginBottom: '20px' }} />
                <Field label="Loan Tape Link (CSV / Excel)" hint="A loan-level data file helps buyers underwrite faster and improves bids.">
                  <input type="url" className="form-input" placeholder="https://docs.google.com/spreadsheets/…" value={form.loanTapeLink} onChange={set('loanTapeLink')} />
                </Field>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP: Review
        ══════════════════════════════════════════════════════════════════════ */}
        {currentLabel === 'Review' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Review &amp; Submit</h2>

            <div style={{ display: 'grid', gap: '0', marginBottom: '28px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              {[
                { label: 'Listing Type', value: form.listingType === 'portfolio' ? 'Loan Portfolio' : 'Single Loan' },
                { label: 'Title', value: form.title },
                { label: 'Performance Status', value: form.performanceStatus },
                { label: 'Asset Class', value: form.assetType },
                { label: 'Lien Position', value: form.lienPosition },
                ...(!isPortfolio ? [{ label: 'Note Type', value: form.noteType }] : []),
                { label: isPortfolio ? 'Total Pool UPB' : 'UPB', value: upbFormatted || form.unpaidBalance },
                ...(isPortfolio ? [{ label: 'Loan Count', value: form.loanCount }] : []),
                ...(isPortfolio ? [{ label: 'State Distribution', value: form.location }] : []),
                ...(!isPortfolio ? [{ label: 'Interest Rate', value: form.firstMtg_interestRate ? `${form.firstMtg_interestRate}%` : '—' }] : []),
                ...(!isPortfolio ? [{ label: 'Origination Date', value: form.firstMtg_originationDate || '—' }] : []),
                ...(!isPortfolio ? [{ label: 'Last Payment Received', value: form.lastPaymentReceivedDate || '—' }] : []),
                ...(!isPortfolio ? [{ label: 'Property State', value: form.propertyState || '—' }] : []),
                ...(!isPortfolio ? [{ label: 'Legal Status', value: form.legalStatus || 'Clear' }] : []),
                ...(!isPortfolio ? [{ label: 'In Bankruptcy', value: form.isInBankruptcy === 'true' ? 'Yes' : 'No' }] : []),
                ...(form.askingPrice ? [{ label: 'Asking Price', value: `$${parseFloat(form.askingPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}` }] : []),
                ...(form.bidDeadline ? [{ label: 'Bid Deadline', value: form.bidDeadline }] : []),
                { label: 'NDA Required', value: form.ndaRequired === 'true' ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '16px', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', minWidth: '160px', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{value || '—'}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn--gold btn--full" disabled={loading} onClick={() => submit('ACTIVE')}>
                {loading && <Spinner size={15} color="#0a0a0a" />}
                {loading ? 'Submitting…' : 'Submit Listing'}
              </button>
              <button className="btn btn--ghost" disabled={loading} onClick={() => submit('DRAFT')}>
                {loading && <Spinner size={14} />}
                Save as Draft
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentLabel !== 'Review' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn--ghost" onClick={back} disabled={step === 1}>← Back</button>
            <button className="btn btn--gold" onClick={next}>Continue →</button>
          </div>
        )}
        {currentLabel === 'Review' && (
          <div style={{ marginTop: '12px' }}>
            <button className="btn btn--ghost btn--sm" onClick={back}>← Back to Edit</button>
          </div>
        )}
      </div>
    </div>
  )
}
