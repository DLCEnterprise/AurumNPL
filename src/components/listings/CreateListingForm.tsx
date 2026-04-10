'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface FormData {
  // Step 1 — Overview
  title: string
  performanceStatus: string
  noteType: string
  assetType: string
  askingPrice: string
  lienPosition: string
  loanCount: string
  description: string
  // Step 2 — Note Terms
  unpaidBalance: string
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
  avgDelinquency: string
  // Step 3 — Property Details
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
  location: string
  region: string
  // Step 4 — Bankruptcy
  isInBankruptcy: string
  bankruptcyChapter: string
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
  // Step 5 — Foreclosure & Legal
  legalStatus: string
  isJudicialState: string
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
  // Step 6 — Modifications
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
  // Step 7 — Documents
  dropboxLink: string
  status: 'DRAFT' | 'ACTIVE'
}

const STEPS: { num: Step; label: string }[] = [
  { num: 1, label: 'Overview' },
  { num: 2, label: 'Note Terms' },
  { num: 3, label: 'Property' },
  { num: 4, label: 'Bankruptcy' },
  { num: 5, label: 'Foreclosure' },
  { num: 6, label: 'Modifications' },
  { num: 7, label: 'Review' },
]

const EMPTY: FormData = {
  title: '', performanceStatus: 'NPL', noteType: 'FIXED', assetType: 'RESIDENTIAL',
  askingPrice: '', lienPosition: 'SENIOR', loanCount: '', description: '',
  unpaidBalance: '', firstMtg_interestRate: '', firstMtg_originationDate: '',
  firstMtg_maturityDate: '', firstMtg_firstPaymentDate: '', firstMtg_originalAmount: '',
  firstMtg_currentBalance: '', firstMtg_monthlyPI: '', firstMtg_monthlyEscrow: '',
  firstMtg_nextDueDate: '', firstMtg_loanTermMonths: '', firstMtg_totalMonthsPaid: '',
  firstMtg_monthsRemaining: '', firstMtg_interestPaidToDate: '', firstMtg_loanStatus: 'Non-Performing',
  lastPaymentReceivedDate: '', paymentAccepted: '', isInterestOnly: 'false',
  interestOnlyPeriod: '', totalMonthlyPayment: '', avgDelinquency: '',
  propertyType: 'SFR', propertyStreet: '', propertyCity: '', propertyState: '',
  propertyZip: '', county: '', yearBuilt: '', floorSizeSqFt: '', lotSizeSqFt: '',
  bedrooms: '', bathrooms: '', occupancyType: '', fairMarketValue: '',
  homePurchaseDate: '', homePurchasePrice: '', ltv: '', cltv: '',
  location: '', region: '',
  isInBankruptcy: 'false', bankruptcyChapter: '', bkFilingDate: '',
  ch13PocFilingDate: '', bkConfirmationDate: '', bkDismissalDate: '',
  ch13DischargedDate: '', ch7PetitionDate: '', ch7CaseNumber: '',
  ch7DateFiled: '', ch7DismissalDate: '', ch7DischargeDate: '',
  prevCh13PetitionDate: '', prevCh13CaseNumber: '', prevCh13DateFiled: '',
  prevCh13DismissalDate: '', prevCh13DischargeDate: '',
  legalStatus: '', isJudicialState: 'false',
  firstMtg_foreclosureDefaultDate: '', firstMtg_foreclosureDefaultAmt: '',
  firstMtg_foreclosureSaleDate: '',
  secondMtg_loanStatus: '', secondMtg_originationDate: '', secondMtg_maturityDate: '',
  secondMtg_originalAmount: '', secondMtg_currentBalance: '', secondMtg_interestRate: '',
  secondMtg_monthlyPI: '', secondMtg_nextDueDate: '',
  secondMtg_foreclosureDefaultDate: '', secondMtg_foreclosureDefaultAmt: '',
  secondMtg_foreclosureSaleDate: '',
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
  dropboxLink: '', status: 'ACTIVE',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
// ── Section header ────────────────────────────────────────────────────────────

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

function Field({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: 'var(--gold-400)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreateListingForm() {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

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

  const validateStep = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (step === 1) {
      if (form.title.trim().length < 5) e.title = 'Title must be at least 5 characters.'
      if (!form.assetType) e.assetType = 'Asset type is required.'
      if (!form.lienPosition) e.lienPosition = 'Lien position is required.'
      if (!form.loanCount || parseOptInt(form.loanCount) == null || parseOptInt(form.loanCount)! <= 0)
        e.loanCount = 'Enter a valid loan count.'
    }
    if (step === 2) {
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
    if (step === 3) {
      if (!form.propertyState.trim()) e.propertyState = 'State is required.'
      if (!form.location.trim()) e.location = 'Location / state(s) is required.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep()) setStep((s) => (s < 7 ? ((s + 1) as Step) : s)) }
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))

  const buildPayload = (status: 'DRAFT' | 'ACTIVE') => {
    const f = form
    return {
      // Listing fields
      title:             f.title.trim(),
      description:       f.description.trim() || undefined,
      assetType:         f.assetType,
      unpaidBalance:     parseOptFloat(f.unpaidBalance)!,
      loanCount:         parseOptInt(f.loanCount)!,
      location:          f.location.trim(),
      region:            f.region || undefined,
      avgDelinquency:    parseOptInt(f.avgDelinquency),
      status,
      dropboxLink:       f.dropboxLink || undefined,
      lienPosition:      f.lienPosition || undefined,
      askingPrice:       parseOptFloat(f.askingPrice),
      performanceStatus: f.performanceStatus || undefined,
      noteType:          f.noteType || undefined,
      // Asset fields — only include if any property data present
      asset: {
        // Note terms
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
        // Property
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
        fairMarketValue: parseOptFloat(f.fairMarketValue),
        homePurchaseDate:  parseOptDate(f.homePurchaseDate),
        homePurchasePrice: parseOptFloat(f.homePurchasePrice),
        ltv:             parseOptFloat(f.ltv) != null ? parseOptFloat(f.ltv)! / 100 : undefined,
        cltv:            parseOptFloat(f.cltv) != null ? parseOptFloat(f.cltv)! / 100 : undefined,
        // Bankruptcy
        isInBankruptcy:        f.isInBankruptcy === 'true' ? true : false,
        bankruptcyChapter:     f.bankruptcyChapter || undefined,
        bkFilingDate:          parseOptDate(f.bkFilingDate),
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
        // Foreclosure & Legal
        legalStatus:                     f.legalStatus || undefined,
        isJudicialState:                 f.isJudicialState === 'true' ? true : f.isJudicialState === 'false' ? false : undefined,
        firstMtg_foreclosureDefaultDate: parseOptDate(f.firstMtg_foreclosureDefaultDate),
        firstMtg_foreclosureDefaultAmt:  parseOptFloat(f.firstMtg_foreclosureDefaultAmt),
        firstMtg_foreclosureSaleDate:    parseOptDate(f.firstMtg_foreclosureSaleDate),
        secondMtg_loanStatus:        f.secondMtg_loanStatus || undefined,
        secondMtg_originationDate:   parseOptDate(f.secondMtg_originationDate),
        secondMtg_maturityDate:      parseOptDate(f.secondMtg_maturityDate),
        secondMtg_originalAmount:    parseOptFloat(f.secondMtg_originalAmount),
        secondMtg_currentBalance:    parseOptFloat(f.secondMtg_currentBalance),
        secondMtg_interestRate:      parseOptFloat(f.secondMtg_interestRate) != null ? parseOptFloat(f.secondMtg_interestRate)! / 100 : undefined,
        secondMtg_monthlyPI:         parseOptFloat(f.secondMtg_monthlyPI),
        secondMtg_nextDueDate:       parseOptDate(f.secondMtg_nextDueDate),
        secondMtg_foreclosureDefaultDate: parseOptDate(f.secondMtg_foreclosureDefaultDate),
        secondMtg_foreclosureDefaultAmt:  parseOptFloat(f.secondMtg_foreclosureDefaultAmt),
        secondMtg_foreclosureSaleDate:    parseOptDate(f.secondMtg_foreclosureSaleDate),
        // Modifications — first
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
        // Modifications — second
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

  const upbFormatted = form.unpaidBalance && !isNaN(parseFloat(form.unpaidBalance))
    ? `$${parseFloat(form.unpaidBalance).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : ''

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', marginBottom: '36px', overflowX: 'auto', paddingBottom: '4px' }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none', minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 600, flexShrink: 0,
                background: step > s.num ? 'var(--gold-gradient)' : step === s.num ? 'rgba(212,168,70,0.15)' : 'var(--bg-elevated)',
                border: step >= s.num ? '1px solid rgba(212,168,70,0.4)' : '1px solid var(--border-light)',
                color: step > s.num ? '#0a0a0a' : step === s.num ? 'var(--gold-300)' : 'var(--text-muted)',
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.62rem', color: step >= s.num ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: step > s.num ? 'rgba(212,168,70,0.3)' : 'var(--border)', margin: '0 4px', marginBottom: '18px', minWidth: '8px' }} />
            )}
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '36px' }}>

        {/* ── Step 1: Overview ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Portfolio Overview</h2>

            <Field label="Listing Title" required error={errors.title}>
              <input type="text" className={`form-input${errors.title ? ' form-input--error' : ''}`}
                placeholder="e.g. Southeast Residential NPL Portfolio"
                value={form.title} onChange={set('title')} />
            </Field>

            <div style={{ marginBottom: '16px' }} />

            <FieldRow cols={2}>
              <Field label="Performance Status" required>
                <select className="form-input" value={form.performanceStatus} onChange={set('performanceStatus')}>
                  <option value="NPL">Non-Performing (NPL)</option>
                  <option value="RPL">Re-Performing (RPL)</option>
                  <option value="SUB">Sub-Performing</option>
                  <option value="PL">Performing</option>
                </select>
              </Field>
              <Field label="Note Type" required>
                <select className="form-input" value={form.noteType} onChange={set('noteType')}>
                  <option value="FIXED">Fixed Rate</option>
                  <option value="ARM">Adjustable Rate (ARM)</option>
                  <option value="IO">Interest Only</option>
                  <option value="BALLOON">Balloon</option>
                </select>
              </Field>
            </FieldRow>

            <FieldRow cols={2}>
              <Field label="Asset Type" required error={errors.assetType}>
                <select className={`form-input${errors.assetType ? ' form-input--error' : ''}`} value={form.assetType} onChange={set('assetType')}>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="CONSUMER">Consumer</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </Field>
              <Field label="Lien Position" required error={errors.lienPosition}>
                <select className={`form-input${errors.lienPosition ? ' form-input--error' : ''}`} value={form.lienPosition} onChange={set('lienPosition')}>
                  <option value="SENIOR">Senior (1st Mortgage)</option>
                  <option value="JUNIOR">Junior (2nd Mortgage)</option>
                </select>
              </Field>
            </FieldRow>

            <FieldRow cols={2}>
              <Field label="Loan Count" required error={errors.loanCount}>
                <input type="number" min="1" className={`form-input${errors.loanCount ? ' form-input--error' : ''}`}
                  placeholder="e.g. 127" value={form.loanCount} onChange={set('loanCount')} />
              </Field>
              <Field label="Asking Price (USD)">
                <input type="number" min="0" className="form-input"
                  placeholder="e.g. 9200000" value={form.askingPrice} onChange={set('askingPrice')} />
              </Field>
            </FieldRow>

            <Field label="Description">
              <textarea className="form-input" rows={4}
                placeholder="Describe the portfolio, collateral characteristics, servicing history…"
                value={form.description} onChange={set('description')} style={{ resize: 'vertical' }} />
            </Field>
          </div>
        )}

        {/* ── Step 2: Note Terms ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Note Terms</h2>

            <SectionTitle>Loan Balances</SectionTitle>
            <FieldRow cols={2}>
              <Field label="UPB — Unpaid Principal Balance" required error={errors.unpaidBalance}>
                <input type="number" min="1" step="1000" className={`form-input${errors.unpaidBalance ? ' form-input--error' : ''}`}
                  placeholder="e.g. 18400000" value={form.unpaidBalance} onChange={set('unpaidBalance')} />
                {upbFormatted && <span style={{ fontSize: '0.75rem', color: 'var(--gold-300)', marginTop: '3px', display: 'block' }}>{upbFormatted}</span>}
              </Field>
              <Field label="Original Loan Amount" required error={errors.firstMtg_originalAmount}>
                <input type="number" min="1" className={`form-input${errors.firstMtg_originalAmount ? ' form-input--error' : ''}`}
                  placeholder="e.g. 20000000" value={form.firstMtg_originalAmount} onChange={set('firstMtg_originalAmount')} />
              </Field>
            </FieldRow>

            <Field label="Current Balance">
              <input type="number" min="0" className="form-input"
                placeholder="e.g. 18400000" value={form.firstMtg_currentBalance} onChange={set('firstMtg_currentBalance')} />
            </Field>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Rate & Payments</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Interest Rate (%)" required error={errors.firstMtg_interestRate}>
                <input type="number" min="0" max="100" step="0.001" className={`form-input${errors.firstMtg_interestRate ? ' form-input--error' : ''}`}
                  placeholder="e.g. 8.5" value={form.firstMtg_interestRate} onChange={set('firstMtg_interestRate')} />
              </Field>
              <Field label="Monthly P&I" required error={errors.firstMtg_monthlyPI}>
                <input type="number" min="0" className={`form-input${errors.firstMtg_monthlyPI ? ' form-input--error' : ''}`}
                  placeholder="e.g. 1450" value={form.firstMtg_monthlyPI} onChange={set('firstMtg_monthlyPI')} />
              </Field>
            </FieldRow>

            <FieldRow cols={3}>
              <Field label="Monthly Escrow">
                <input type="number" min="0" className="form-input" placeholder="e.g. 350" value={form.firstMtg_monthlyEscrow} onChange={set('firstMtg_monthlyEscrow')} />
              </Field>
              <Field label="Total Monthly Payment">
                <input type="number" min="0" className="form-input" placeholder="e.g. 1800" value={form.totalMonthlyPayment} onChange={set('totalMonthlyPayment')} />
              </Field>
              <Field label="Avg. Delinquency (months)">
                <input type="number" min="0" className="form-input" placeholder="e.g. 18" value={form.avgDelinquency} onChange={set('avgDelinquency')} />
              </Field>
            </FieldRow>

            <FieldRow cols={2}>
              <Field label="Interest Only?">
                <select className="form-input" value={form.isInterestOnly} onChange={set('isInterestOnly')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </Field>
              {form.isInterestOnly === 'true' && (
                <Field label="I/O Period (months)">
                  <input type="number" min="0" className="form-input" placeholder="e.g. 60" value={form.interestOnlyPeriod} onChange={set('interestOnlyPeriod')} />
                </Field>
              )}
            </FieldRow>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Loan Dates</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Origination Date" required error={errors.firstMtg_originationDate}>
                <input type="date" className={`form-input${errors.firstMtg_originationDate ? ' form-input--error' : ''}`}
                  value={form.firstMtg_originationDate} onChange={set('firstMtg_originationDate')} />
              </Field>
              <Field label="Maturity Date" required error={errors.firstMtg_maturityDate}>
                <input type="date" className={`form-input${errors.firstMtg_maturityDate ? ' form-input--error' : ''}`}
                  value={form.firstMtg_maturityDate} onChange={set('firstMtg_maturityDate')} />
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
                <input type="date" className={`form-input${errors.lastPaymentReceivedDate ? ' form-input--error' : ''}`}
                  value={form.lastPaymentReceivedDate} onChange={set('lastPaymentReceivedDate')} />
              </Field>
              <Field label="Interest Paid To Date">
                <input type="date" className="form-input" value={form.firstMtg_interestPaidToDate} onChange={set('firstMtg_interestPaidToDate')} />
              </Field>
            </FieldRow>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Loan Status</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Loan Status">
                <select className="form-input" value={form.firstMtg_loanStatus} onChange={set('firstMtg_loanStatus')}>
                  <option value="Non-Performing">Non-Performing</option>
                  <option value="Re-Performing">Re-Performing</option>
                  <option value="Sub-Performing">Sub-Performing</option>
                  <option value="Current">Current</option>
                </select>
              </Field>
              <Field label="Payment Accepted">
                <input type="text" className="form-input" placeholder="e.g. ACH, Wire Transfer"
                  value={form.paymentAccepted} onChange={set('paymentAccepted')} />
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

        {/* ── Step 3: Property Details ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Property Details</h2>

            <SectionTitle>Property Type & Address</SectionTitle>
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
                <input type="text" className={`form-input${errors.propertyState ? ' form-input--error' : ''}`}
                  placeholder="FL" maxLength={2} value={form.propertyState} onChange={set('propertyState')} />
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

            <Field label="Location / State(s) for Listing Search" required error={errors.location}>
              <input type="text" className={`form-input${errors.location ? ' form-input--error' : ''}`}
                placeholder="e.g. FL, GA, SC" value={form.location} onChange={set('location')} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>Used for search/filtering. Use state abbreviations or &quot;Nationwide&quot;.</span>
            </Field>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Property Characteristics</SectionTitle>
            <FieldRow cols={4}>
              <Field label="Year Built">
                <input type="number" min="1800" max="2030" className="form-input" placeholder="1995" value={form.yearBuilt} onChange={set('yearBuilt')} />
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
              <Field label="Fair Market Value (FMV)">
                <input type="number" min="0" className="form-input" placeholder="e.g. 250000" value={form.fairMarketValue} onChange={set('fairMarketValue')} />
              </Field>
              <Field label="Home Purchase Price">
                <input type="number" min="0" className="form-input" placeholder="e.g. 220000" value={form.homePurchasePrice} onChange={set('homePurchasePrice')} />
              </Field>
            </FieldRow>
            <FieldRow cols={3}>
              <Field label="Purchase Date">
                <input type="date" className="form-input" value={form.homePurchaseDate} onChange={set('homePurchaseDate')} />
              </Field>
              <Field label="LTV (%)">
                <input type="number" min="0" max="999" step="0.01" className="form-input" placeholder="e.g. 95.5" value={form.ltv} onChange={set('ltv')} />
              </Field>
              <Field label="CLTV (%)">
                <input type="number" min="0" max="999" step="0.01" className="form-input" placeholder="e.g. 110.2" value={form.cltv} onChange={set('cltv')} />
              </Field>
            </FieldRow>
          </div>
        )}

        {/* ── Step 4: Bankruptcy ── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Bankruptcy</h2>

            <SectionTitle>Current Bankruptcy Status</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Currently in Bankruptcy?">
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
                  <Field label="BK Filing Date">
                    <input type="date" className="form-input" value={form.bkFilingDate} onChange={set('bkFilingDate')} />
                  </Field>
                  <Field label="Confirmation Date">
                    <input type="date" className="form-input" value={form.bkConfirmationDate} onChange={set('bkConfirmationDate')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={2}>
                  <Field label="Dismissal Date">
                    <input type="date" className="form-input" value={form.bkDismissalDate} onChange={set('bkDismissalDate')} />
                  </Field>
                  <Field label="Ch.13 POC Filing Date">
                    <input type="date" className="form-input" value={form.ch13PocFilingDate} onChange={set('ch13PocFilingDate')} />
                  </Field>
                </FieldRow>
                <Field label="Ch.13 Discharged Date">
                  <input type="date" className="form-input" value={form.ch13DischargedDate} onChange={set('ch13DischargedDate')} />
                </Field>
              </>
            )}

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Previous BK History — Chapter 7</SectionTitle>
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

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>Previous BK History — Chapter 13</SectionTitle>
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
          </div>
        )}

        {/* ── Step 5: Foreclosure & Legal ── */}
        {step === 5 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Foreclosure & Legal</h2>

            <SectionTitle>Legal Status</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Legal Status">
                <select className="form-input" value={form.legalStatus} onChange={set('legalStatus')}>
                  <option value="">Select…</option>
                  <option value="Pre-Foreclosure">Pre-Foreclosure</option>
                  <option value="Foreclosure Filed">Foreclosure Filed</option>
                  <option value="Foreclosure — Suspended">Foreclosure — Suspended</option>
                  <option value="REO">REO</option>
                  <option value="Bankruptcy Stay">Bankruptcy Stay</option>
                  <option value="Clear">Clear</option>
                </select>
              </Field>
              <Field label="Judicial State?">
                <select className="form-input" value={form.isJudicialState} onChange={set('isJudicialState')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </Field>
            </FieldRow>

            <div style={{ marginBottom: '16px' }} />
            <SectionTitle>1st Mortgage — Foreclosure</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Default Date">
                <input type="date" className="form-input" value={form.firstMtg_foreclosureDefaultDate} onChange={set('firstMtg_foreclosureDefaultDate')} />
              </Field>
              <Field label="Default Amount">
                <input type="number" min="0" className="form-input" placeholder="e.g. 24500" value={form.firstMtg_foreclosureDefaultAmt} onChange={set('firstMtg_foreclosureDefaultAmt')} />
              </Field>
            </FieldRow>
            <Field label="Foreclosure Sale Date">
              <input type="date" className="form-input" value={form.firstMtg_foreclosureSaleDate} onChange={set('firstMtg_foreclosureSaleDate')} />
            </Field>

            <div style={{ marginBottom: '24px' }} />
            <SectionTitle>2nd Mortgage — Current (if applicable)</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Loan Status">
                <select className="form-input" value={form.secondMtg_loanStatus} onChange={set('secondMtg_loanStatus')}>
                  <option value="">N/A — No 2nd Mortgage</option>
                  <option value="Non-Performing">Non-Performing</option>
                  <option value="Re-Performing">Re-Performing</option>
                  <option value="Current">Current</option>
                  <option value="Charged Off">Charged Off</option>
                </select>
              </Field>
              <Field label="Interest Rate (%)">
                <input type="number" min="0" max="100" step="0.001" className="form-input"
                  placeholder="e.g. 10.5" value={form.secondMtg_interestRate} onChange={set('secondMtg_interestRate')} />
              </Field>
            </FieldRow>

            {form.secondMtg_loanStatus && (
              <>
                <FieldRow cols={2}>
                  <Field label="Original Amount">
                    <input type="number" min="0" className="form-input" placeholder="e.g. 45000" value={form.secondMtg_originalAmount} onChange={set('secondMtg_originalAmount')} />
                  </Field>
                  <Field label="Current Balance">
                    <input type="number" min="0" className="form-input" placeholder="e.g. 38000" value={form.secondMtg_currentBalance} onChange={set('secondMtg_currentBalance')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={2}>
                  <Field label="Monthly P&I">
                    <input type="number" min="0" className="form-input" placeholder="e.g. 480" value={form.secondMtg_monthlyPI} onChange={set('secondMtg_monthlyPI')} />
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

                <SectionTitle>2nd Mortgage — Foreclosure</SectionTitle>
                <FieldRow cols={2}>
                  <Field label="Default Date">
                    <input type="date" className="form-input" value={form.secondMtg_foreclosureDefaultDate} onChange={set('secondMtg_foreclosureDefaultDate')} />
                  </Field>
                  <Field label="Default Amount">
                    <input type="number" min="0" className="form-input" placeholder="e.g. 8000" value={form.secondMtg_foreclosureDefaultAmt} onChange={set('secondMtg_foreclosureDefaultAmt')} />
                  </Field>
                </FieldRow>
                <Field label="Sale Date">
                  <input type="date" className="form-input" value={form.secondMtg_foreclosureSaleDate} onChange={set('secondMtg_foreclosureSaleDate')} />
                </Field>
              </>
            )}
          </div>
        )}

        {/* ── Step 6: Modifications ── */}
        {step === 6 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Modification Terms</h2>

            <SectionTitle>1st Mortgage — Modification</SectionTitle>
            <FieldRow cols={2}>
              <Field label="Loan Was Modified?">
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
                  <Field label="Mod First Payment Date">
                    <input type="date" className="form-input" value={form.firstMtg_modFirstPayDate} onChange={set('firstMtg_modFirstPayDate')} />
                  </Field>
                  <Field label="Mod Term (months)">
                    <input type="number" min="0" className="form-input" placeholder="e.g. 480" value={form.firstMtg_modTermMonths} onChange={set('firstMtg_modTermMonths')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={2}>
                  <Field label="Mod Loan Amount">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modLoanAmount} onChange={set('firstMtg_modLoanAmount')} />
                  </Field>
                  <Field label="Mod Current Balance">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modCurrentBalance} onChange={set('firstMtg_modCurrentBalance')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={3}>
                  <Field label="Deferred Balance">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modDeferredBalance} onChange={set('firstMtg_modDeferredBalance')} />
                  </Field>
                  <Field label="Mod Interest Rate (%)">
                    <input type="number" min="0" max="100" step="0.001" className="form-input" value={form.firstMtg_modInterestRate} onChange={set('firstMtg_modInterestRate')} />
                  </Field>
                  <Field label="Mod Monthly P&I">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modMonthlyPI} onChange={set('firstMtg_modMonthlyPI')} />
                  </Field>
                </FieldRow>
                <FieldRow cols={3}>
                  <Field label="Mod Monthly Escrow">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modMonthlyEscrow} onChange={set('firstMtg_modMonthlyEscrow')} />
                  </Field>
                  <Field label="Mod Months Paid">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modMonthsPaid} onChange={set('firstMtg_modMonthsPaid')} />
                  </Field>
                  <Field label="Payments Remaining">
                    <input type="number" min="0" className="form-input" value={form.firstMtg_modPaymentsRemaining} onChange={set('firstMtg_modPaymentsRemaining')} />
                  </Field>
                </FieldRow>
              </>
            )}

            {form.secondMtg_loanStatus && (
              <>
                <div style={{ marginBottom: '16px' }} />
                <SectionTitle>2nd Mortgage — Modification</SectionTitle>
                <FieldRow cols={2}>
                  <Field label="2nd Loan Modified?">
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
                        <input type="number" min="0" className="form-input" value={form.secondMtg_modLoanAmount} onChange={set('secondMtg_modLoanAmount')} />
                      </Field>
                      <Field label="Mod Current Balance">
                        <input type="number" min="0" className="form-input" value={form.secondMtg_modCurrentBalance} onChange={set('secondMtg_modCurrentBalance')} />
                      </Field>
                    </FieldRow>
                    <FieldRow cols={3}>
                      <Field label="Deferred Balance">
                        <input type="number" min="0" className="form-input" value={form.secondMtg_modDeferredBalance} onChange={set('secondMtg_modDeferredBalance')} />
                      </Field>
                      <Field label="Mod Interest Rate (%)">
                        <input type="number" min="0" max="100" step="0.001" className="form-input" value={form.secondMtg_modInterestRate} onChange={set('secondMtg_modInterestRate')} />
                      </Field>
                      <Field label="Mod Monthly P&I">
                        <input type="number" min="0" className="form-input" value={form.secondMtg_modMonthlyPI} onChange={set('secondMtg_modMonthlyPI')} />
                      </Field>
                    </FieldRow>
                    <FieldRow cols={3}>
                      <Field label="Mod Term (months)">
                        <input type="number" min="0" className="form-input" value={form.secondMtg_modTermMonths} onChange={set('secondMtg_modTermMonths')} />
                      </Field>
                      <Field label="Mod First Pay Date">
                        <input type="date" className="form-input" value={form.secondMtg_modFirstPayDate} onChange={set('secondMtg_modFirstPayDate')} />
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

        {/* ── Step 7: Documents & Review ── */}
        {step === 7 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>Review & Submit</h2>

            <div className="glass-card" style={{ padding: '20px 24px', background: 'rgba(212,168,70,0.04)', border: '1px solid rgba(212,168,70,0.12)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>Documents</div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Dropbox Documents Link
                </label>
                <input type="url" className="form-input" placeholder="https://www.dropbox.com/…"
                  value={form.dropboxLink} onChange={set('dropboxLink')} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Only shared with buyers whose bids you accept.
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px', marginBottom: '28px' }}>
              {[
                { label: 'Title', value: form.title },
                { label: 'Performance Status', value: form.performanceStatus },
                { label: 'Note Type', value: form.noteType },
                { label: 'Asset Type', value: form.assetType },
                { label: 'Lien Position', value: form.lienPosition },
                { label: 'Loan Count', value: form.loanCount },
                ...(form.askingPrice ? [{ label: 'Asking Price', value: `$${parseFloat(form.askingPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}` }] : []),
                { label: 'UPB', value: upbFormatted || form.unpaidBalance },
                { label: 'Interest Rate', value: form.firstMtg_interestRate ? `${form.firstMtg_interestRate}%` : '—' },
                { label: 'Origination Date', value: form.firstMtg_originationDate || '—' },
                { label: 'Last Payment Received', value: form.lastPaymentReceivedDate || '—' },
                { label: 'Property State', value: form.propertyState || '—' },
                { label: 'Location', value: form.location },
                ...(form.propertyStreet ? [{ label: 'Address', value: `${form.propertyStreet}, ${form.propertyCity}, ${form.propertyState}` }] : []),
                { label: 'In Bankruptcy', value: form.isInBankruptcy === 'true' ? 'Yes' : 'No' },
                { label: 'Legal Status', value: form.legalStatus || '—' },
                { label: '1st Mortgage Modified', value: form.firstMtg_isModified === 'true' ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '16px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', minWidth: '160px', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{value}</span>
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
        {step < 7 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn--ghost" onClick={back} disabled={step === 1}>← Back</button>
            <button className="btn btn--gold" onClick={next}>Continue →</button>
          </div>
        )}
        {step === 7 && (
          <div style={{ marginTop: '12px' }}>
            <button className="btn btn--ghost btn--sm" onClick={back}>← Back to Edit</button>
          </div>
        )}
      </div>
    </div>
  )
}
