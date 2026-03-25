'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Skeleton'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>{title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
      {children}
    </div>
  )
}

function Field({
  label, name, type = 'text', value, onChange, placeholder, required, options,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange: (name: string, value: string) => void
  placeholder?: string
  required?: boolean
  options?: string[]
}) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label style={{ fontSize: '0.72rem' }}>{label}{required && ' *'}</label>
      {options ? (
        <select className="form-input" value={value} onChange={(e) => onChange(name, e.target.value)}>
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className="form-input"
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const LOAN_STATUSES = ['Current', 'Past-Due', 'Default', 'Foreclosure', 'Bankruptcy', 'Modified']
const OCCUPANCY_TYPES = ['Owner Occupied', 'Non-Owner Occupied']
const BK_CHAPTERS = ['7', '11', '13']

export function ManualAssetForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use a flat string map for all field values — easier to handle large forms
  const [fields, setFields] = useState<Record<string, string>>({
    // Listing
    title: '',
    assetType: 'RESIDENTIAL',
    // Property
    propertyStreet: '', propertyCity: '', propertyState: '', propertyZip: '',
    fairMarketValue: '', occupancyType: '', homePurchaseDate: '', homePurchasePrice: '',
    ltv: '', cltv: '', payoffCltv: '',
    // First mortgage
    firstMtg_loanStatus: '', firstMtg_originalAmount: '', firstMtg_currentBalance: '',
    firstMtg_interestRate: '', firstMtg_monthlyPI: '', firstMtg_monthlyEscrow: '',
    firstMtg_originationDate: '', firstMtg_maturityDate: '', firstMtg_firstPaymentDate: '',
    firstMtg_nextDueDate: '', firstMtg_interestPaidToDate: '',
    firstMtg_loanTermMonths: '', firstMtg_totalMonthsPaid: '', firstMtg_monthsRemaining: '',
    // Modification
    firstMtg_isModified: '', firstMtg_hasBalloon: '', firstMtg_balloonDate: '',
    firstMtg_modDate: '', firstMtg_modMaturityDate: '', firstMtg_modFirstPayDate: '',
    firstMtg_modLoanAmount: '', firstMtg_modCurrentBalance: '', firstMtg_modDeferredBalance: '',
    firstMtg_modInterestRate: '', firstMtg_modMonthlyPI: '', firstMtg_modMonthlyEscrow: '',
    firstMtg_modTermMonths: '', firstMtg_modMonthsPaid: '', firstMtg_modPaymentsRemaining: '',
    firstMtg_modInterestPaidTo: '',
    // Foreclosure
    firstMtg_foreclosureDefaultDate: '', firstMtg_foreclosureDefaultAmt: '', firstMtg_foreclosureSaleDate: '',
    // Second mortgage
    hasSecond: '',
    secondMtg_loanStatus: '', secondMtg_originalAmount: '', secondMtg_currentBalance: '',
    secondMtg_interestRate: '', secondMtg_monthlyPI: '', secondMtg_monthlyEscrow: '',
    secondMtg_originationDate: '', secondMtg_maturityDate: '', secondMtg_nextDueDate: '',
    secondMtg_loanTermMonths: '', secondMtg_totalMonthsPaid: '', secondMtg_monthsRemaining: '',
    // Bankruptcy
    isInBankruptcy: '', bankruptcyChapter: '', bkFilingDate: '',
    ch13PocFilingDate: '', bkConfirmationDate: '', bkDismissalDate: '', ch13DischargedDate: '',
  })

  const set = (name: string, value: string) => setFields((prev) => ({ ...prev, [name]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fields.propertyState && !fields.propertyCity) {
      setError('Please enter at least a city and state for the property.')
      return
    }
    if (!fields.firstMtg_currentBalance) {
      setError('First Mortgage Current Balance is required.')
      return
    }

    setLoading(true)

    const parseNum = (v: string) => v ? parseFloat(v.replace(/[$,%,\s]/g, '')) || null : null
    const parseInt2 = (v: string) => v ? parseInt(v) || null : null
    const parseBool = (v: string) => v === 'Yes' ? true : v === 'No' ? false : null
    const parseDate = (v: string) => v || null

    const body = {
      // Listing fields
      title: fields.title || [fields.propertyStreet, fields.propertyCity, fields.propertyState].filter(Boolean).join(', ') || 'Manual Entry',
      assetType: fields.assetType || 'RESIDENTIAL',
      // Asset fields
      propertyStreet: fields.propertyStreet || null,
      propertyCity: fields.propertyCity || null,
      propertyState: fields.propertyState || null,
      propertyZip: fields.propertyZip || null,
      fairMarketValue: parseNum(fields.fairMarketValue),
      occupancyType: fields.occupancyType || null,
      homePurchaseDate: parseDate(fields.homePurchaseDate),
      homePurchasePrice: parseNum(fields.homePurchasePrice),
      ltv: parseNum(fields.ltv) ? (parseNum(fields.ltv)! > 1 ? parseNum(fields.ltv)! / 100 : parseNum(fields.ltv)) : null,
      cltv: parseNum(fields.cltv) ? (parseNum(fields.cltv)! > 1 ? parseNum(fields.cltv)! / 100 : parseNum(fields.cltv)) : null,
      payoffCltv: parseNum(fields.payoffCltv) ? (parseNum(fields.payoffCltv)! > 1 ? parseNum(fields.payoffCltv)! / 100 : parseNum(fields.payoffCltv)) : null,
      firstMtg_loanStatus: fields.firstMtg_loanStatus || null,
      firstMtg_originalAmount: parseNum(fields.firstMtg_originalAmount),
      firstMtg_currentBalance: parseNum(fields.firstMtg_currentBalance),
      firstMtg_interestRate: parseNum(fields.firstMtg_interestRate) ? (parseNum(fields.firstMtg_interestRate)! > 1 ? parseNum(fields.firstMtg_interestRate)! / 100 : parseNum(fields.firstMtg_interestRate)) : null,
      firstMtg_monthlyPI: parseNum(fields.firstMtg_monthlyPI),
      firstMtg_monthlyEscrow: parseNum(fields.firstMtg_monthlyEscrow),
      firstMtg_originationDate: parseDate(fields.firstMtg_originationDate),
      firstMtg_maturityDate: parseDate(fields.firstMtg_maturityDate),
      firstMtg_firstPaymentDate: parseDate(fields.firstMtg_firstPaymentDate),
      firstMtg_nextDueDate: parseDate(fields.firstMtg_nextDueDate),
      firstMtg_interestPaidToDate: parseDate(fields.firstMtg_interestPaidToDate),
      firstMtg_loanTermMonths: parseInt2(fields.firstMtg_loanTermMonths),
      firstMtg_totalMonthsPaid: parseInt2(fields.firstMtg_totalMonthsPaid),
      firstMtg_monthsRemaining: parseInt2(fields.firstMtg_monthsRemaining),
      firstMtg_isModified: parseBool(fields.firstMtg_isModified),
      firstMtg_hasBalloon: parseBool(fields.firstMtg_hasBalloon),
      firstMtg_balloonDate: parseDate(fields.firstMtg_balloonDate),
      firstMtg_modDate: parseDate(fields.firstMtg_modDate),
      firstMtg_modMaturityDate: parseDate(fields.firstMtg_modMaturityDate),
      firstMtg_modFirstPayDate: parseDate(fields.firstMtg_modFirstPayDate),
      firstMtg_modLoanAmount: parseNum(fields.firstMtg_modLoanAmount),
      firstMtg_modCurrentBalance: parseNum(fields.firstMtg_modCurrentBalance),
      firstMtg_modDeferredBalance: parseNum(fields.firstMtg_modDeferredBalance),
      firstMtg_modInterestRate: parseNum(fields.firstMtg_modInterestRate) ? (parseNum(fields.firstMtg_modInterestRate)! > 1 ? parseNum(fields.firstMtg_modInterestRate)! / 100 : parseNum(fields.firstMtg_modInterestRate)) : null,
      firstMtg_modMonthlyPI: parseNum(fields.firstMtg_modMonthlyPI),
      firstMtg_modMonthlyEscrow: parseNum(fields.firstMtg_modMonthlyEscrow),
      firstMtg_modTermMonths: parseInt2(fields.firstMtg_modTermMonths),
      firstMtg_modMonthsPaid: parseInt2(fields.firstMtg_modMonthsPaid),
      firstMtg_modPaymentsRemaining: parseInt2(fields.firstMtg_modPaymentsRemaining),
      firstMtg_modInterestPaidTo: parseDate(fields.firstMtg_modInterestPaidTo),
      firstMtg_foreclosureDefaultDate: parseDate(fields.firstMtg_foreclosureDefaultDate),
      firstMtg_foreclosureDefaultAmt: parseNum(fields.firstMtg_foreclosureDefaultAmt),
      firstMtg_foreclosureSaleDate: parseDate(fields.firstMtg_foreclosureSaleDate),
      ...(fields.hasSecond === 'Yes' ? {
        secondMtg_loanStatus: fields.secondMtg_loanStatus || null,
        secondMtg_originalAmount: parseNum(fields.secondMtg_originalAmount),
        secondMtg_currentBalance: parseNum(fields.secondMtg_currentBalance),
        secondMtg_interestRate: parseNum(fields.secondMtg_interestRate) ? (parseNum(fields.secondMtg_interestRate)! > 1 ? parseNum(fields.secondMtg_interestRate)! / 100 : parseNum(fields.secondMtg_interestRate)) : null,
        secondMtg_monthlyPI: parseNum(fields.secondMtg_monthlyPI),
        secondMtg_monthlyEscrow: parseNum(fields.secondMtg_monthlyEscrow),
        secondMtg_originationDate: parseDate(fields.secondMtg_originationDate),
        secondMtg_maturityDate: parseDate(fields.secondMtg_maturityDate),
        secondMtg_nextDueDate: parseDate(fields.secondMtg_nextDueDate),
        secondMtg_loanTermMonths: parseInt2(fields.secondMtg_loanTermMonths),
        secondMtg_totalMonthsPaid: parseInt2(fields.secondMtg_totalMonthsPaid),
        secondMtg_monthsRemaining: parseInt2(fields.secondMtg_monthsRemaining),
      } : {}),
      isInBankruptcy: parseBool(fields.isInBankruptcy),
      bankruptcyChapter: fields.bankruptcyChapter || null,
      bkFilingDate: parseDate(fields.bkFilingDate),
      ch13PocFilingDate: parseDate(fields.ch13PocFilingDate),
      bkConfirmationDate: parseDate(fields.bkConfirmationDate),
      bkDismissalDate: parseDate(fields.bkDismissalDate),
      ch13DischargedDate: parseDate(fields.ch13DischargedDate),
    }

    const res = await fetch('/api/listings/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Failed to create listing. Please try again.')
      return
    }

    router.push(`/listings/${data.data.listingId}`)
  }

  const isModified = fields.firstMtg_isModified === 'Yes'
  const hasSecond = fields.hasSecond === 'Yes'
  const isInBankruptcy = fields.isInBankruptcy === 'Yes'

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert--error" style={{ marginBottom: '20px' }}>{error}</div>}

      {/* Listing title + type */}
      <Section title="Listing Details" defaultOpen>
        <Row>
          <Field label="Listing Title" name="title" value={fields.title} onChange={set} placeholder="Auto-generated from address if blank" />
          <Field label="Asset Type" name="assetType" value={fields.assetType} onChange={set}
            options={['RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED']} />
        </Row>
      </Section>

      {/* Property */}
      <Section title="Property Details" defaultOpen>
        <Row>
          <Field label="Street Address" name="propertyStreet" value={fields.propertyStreet} onChange={set} placeholder="123 Main St" />
          <Field label="City" name="propertyCity" value={fields.propertyCity} onChange={set} placeholder="Miami" />
          <Field label="State" name="propertyState" value={fields.propertyState} onChange={set} placeholder="FL" />
          <Field label="Zip" name="propertyZip" value={fields.propertyZip} onChange={set} placeholder="33101" />
        </Row>
        <Row>
          <Field label="Fair Market Value ($)" name="fairMarketValue" value={fields.fairMarketValue} onChange={set} placeholder="250000" />
          <Field label="Occupancy Type" name="occupancyType" value={fields.occupancyType} onChange={set} options={OCCUPANCY_TYPES} />
          <Field label="Purchase Date" name="homePurchaseDate" type="date" value={fields.homePurchaseDate} onChange={set} />
          <Field label="Purchase Price ($)" name="homePurchasePrice" value={fields.homePurchasePrice} onChange={set} placeholder="200000" />
        </Row>
        <Row>
          <Field label="LTV (%)" name="ltv" value={fields.ltv} onChange={set} placeholder="85" />
          <Field label="CLTV (%)" name="cltv" value={fields.cltv} onChange={set} placeholder="90" />
          <Field label="Payoff CLTV (%)" name="payoffCltv" value={fields.payoffCltv} onChange={set} placeholder="95" />
        </Row>
      </Section>

      {/* First Mortgage */}
      <Section title="First Mortgage — Current Loan" defaultOpen>
        <Row>
          <Field label="Loan Status" name="firstMtg_loanStatus" value={fields.firstMtg_loanStatus} onChange={set} options={LOAN_STATUSES} />
          <Field label="Original Loan Amount ($)" name="firstMtg_originalAmount" value={fields.firstMtg_originalAmount} onChange={set} placeholder="200000" />
          <Field label="Current Balance ($) *" name="firstMtg_currentBalance" value={fields.firstMtg_currentBalance} onChange={set} placeholder="185000" required />
        </Row>
        <Row>
          <Field label="Interest Rate (%)" name="firstMtg_interestRate" value={fields.firstMtg_interestRate} onChange={set} placeholder="6.5" />
          <Field label="Monthly P&I ($)" name="firstMtg_monthlyPI" value={fields.firstMtg_monthlyPI} onChange={set} placeholder="1264" />
          <Field label="Monthly Escrow ($)" name="firstMtg_monthlyEscrow" value={fields.firstMtg_monthlyEscrow} onChange={set} placeholder="350" />
        </Row>
        <Row>
          <Field label="Origination Date" name="firstMtg_originationDate" type="date" value={fields.firstMtg_originationDate} onChange={set} />
          <Field label="Maturity Date" name="firstMtg_maturityDate" type="date" value={fields.firstMtg_maturityDate} onChange={set} />
          <Field label="First Payment Date" name="firstMtg_firstPaymentDate" type="date" value={fields.firstMtg_firstPaymentDate} onChange={set} />
          <Field label="Next Due Date" name="firstMtg_nextDueDate" type="date" value={fields.firstMtg_nextDueDate} onChange={set} />
        </Row>
        <Row>
          <Field label="Loan Term (months)" name="firstMtg_loanTermMonths" type="number" value={fields.firstMtg_loanTermMonths} onChange={set} placeholder="360" />
          <Field label="Months Paid" name="firstMtg_totalMonthsPaid" type="number" value={fields.firstMtg_totalMonthsPaid} onChange={set} placeholder="48" />
          <Field label="Months Remaining" name="firstMtg_monthsRemaining" type="number" value={fields.firstMtg_monthsRemaining} onChange={set} placeholder="312" />
          <Field label="Interest Paid To Date" name="firstMtg_interestPaidToDate" type="date" value={fields.firstMtg_interestPaidToDate} onChange={set} />
        </Row>
        <Row>
          <Field label="Has Been Modified?" name="firstMtg_isModified" value={fields.firstMtg_isModified} onChange={set} options={['Yes', 'No']} />
        </Row>
      </Section>

      {/* Modification */}
      {isModified && (
        <Section title="First Mortgage — Modification Terms" defaultOpen>
          <Row>
            <Field label="Modification Date" name="firstMtg_modDate" type="date" value={fields.firstMtg_modDate} onChange={set} />
            <Field label="Mod Maturity Date" name="firstMtg_modMaturityDate" type="date" value={fields.firstMtg_modMaturityDate} onChange={set} />
            <Field label="Mod First Payment Date" name="firstMtg_modFirstPayDate" type="date" value={fields.firstMtg_modFirstPayDate} onChange={set} />
            <Field label="Has Balloon?" name="firstMtg_hasBalloon" value={fields.firstMtg_hasBalloon} onChange={set} options={['Yes', 'No']} />
          </Row>
          {fields.firstMtg_hasBalloon === 'Yes' && (
            <Row>
              <Field label="Balloon Date" name="firstMtg_balloonDate" type="date" value={fields.firstMtg_balloonDate} onChange={set} />
            </Row>
          )}
          <Row>
            <Field label="Mod Loan Amount ($)" name="firstMtg_modLoanAmount" value={fields.firstMtg_modLoanAmount} onChange={set} placeholder="180000" />
            <Field label="Mod Current Balance ($)" name="firstMtg_modCurrentBalance" value={fields.firstMtg_modCurrentBalance} onChange={set} placeholder="175000" />
            <Field label="Deferred Balance ($)" name="firstMtg_modDeferredBalance" value={fields.firstMtg_modDeferredBalance} onChange={set} placeholder="0" />
          </Row>
          <Row>
            <Field label="Mod Interest Rate (%)" name="firstMtg_modInterestRate" value={fields.firstMtg_modInterestRate} onChange={set} placeholder="4.0" />
            <Field label="Mod Monthly P&I ($)" name="firstMtg_modMonthlyPI" value={fields.firstMtg_modMonthlyPI} onChange={set} placeholder="950" />
            <Field label="Mod Monthly Escrow ($)" name="firstMtg_modMonthlyEscrow" value={fields.firstMtg_modMonthlyEscrow} onChange={set} placeholder="350" />
          </Row>
          <Row>
            <Field label="Mod Term (months)" name="firstMtg_modTermMonths" type="number" value={fields.firstMtg_modTermMonths} onChange={set} placeholder="360" />
            <Field label="Mod Months Paid" name="firstMtg_modMonthsPaid" type="number" value={fields.firstMtg_modMonthsPaid} onChange={set} />
            <Field label="Mod Payments Remaining" name="firstMtg_modPaymentsRemaining" type="number" value={fields.firstMtg_modPaymentsRemaining} onChange={set} />
            <Field label="Mod Interest Paid To" name="firstMtg_modInterestPaidTo" type="date" value={fields.firstMtg_modInterestPaidTo} onChange={set} />
          </Row>
        </Section>
      )}

      {/* Foreclosure */}
      <Section title="First Mortgage — Foreclosure Status">
        <Row>
          <Field label="Notice of Default Date" name="firstMtg_foreclosureDefaultDate" type="date" value={fields.firstMtg_foreclosureDefaultDate} onChange={set} />
          <Field label="Default Amount ($)" name="firstMtg_foreclosureDefaultAmt" value={fields.firstMtg_foreclosureDefaultAmt} onChange={set} placeholder="0" />
          <Field label="Notice of Sale Date" name="firstMtg_foreclosureSaleDate" type="date" value={fields.firstMtg_foreclosureSaleDate} onChange={set} />
        </Row>
      </Section>

      {/* Second Mortgage */}
      <Section title="Second Mortgage">
        <Row>
          <Field label="Is there a second mortgage?" name="hasSecond" value={fields.hasSecond} onChange={set} options={['Yes', 'No']} />
        </Row>
        {hasSecond && (
          <>
            <Row>
              <Field label="Loan Status" name="secondMtg_loanStatus" value={fields.secondMtg_loanStatus} onChange={set} options={LOAN_STATUSES} />
              <Field label="Original Amount ($)" name="secondMtg_originalAmount" value={fields.secondMtg_originalAmount} onChange={set} placeholder="50000" />
              <Field label="Current Balance ($)" name="secondMtg_currentBalance" value={fields.secondMtg_currentBalance} onChange={set} placeholder="45000" />
            </Row>
            <Row>
              <Field label="Interest Rate (%)" name="secondMtg_interestRate" value={fields.secondMtg_interestRate} onChange={set} placeholder="7.5" />
              <Field label="Monthly P&I ($)" name="secondMtg_monthlyPI" value={fields.secondMtg_monthlyPI} onChange={set} />
              <Field label="Monthly Escrow ($)" name="secondMtg_monthlyEscrow" value={fields.secondMtg_monthlyEscrow} onChange={set} />
            </Row>
            <Row>
              <Field label="Origination Date" name="secondMtg_originationDate" type="date" value={fields.secondMtg_originationDate} onChange={set} />
              <Field label="Maturity Date" name="secondMtg_maturityDate" type="date" value={fields.secondMtg_maturityDate} onChange={set} />
              <Field label="Next Due Date" name="secondMtg_nextDueDate" type="date" value={fields.secondMtg_nextDueDate} onChange={set} />
            </Row>
            <Row>
              <Field label="Loan Term (months)" name="secondMtg_loanTermMonths" type="number" value={fields.secondMtg_loanTermMonths} onChange={set} />
              <Field label="Months Paid" name="secondMtg_totalMonthsPaid" type="number" value={fields.secondMtg_totalMonthsPaid} onChange={set} />
              <Field label="Months Remaining" name="secondMtg_monthsRemaining" type="number" value={fields.secondMtg_monthsRemaining} onChange={set} />
            </Row>
          </>
        )}
      </Section>

      {/* Bankruptcy */}
      <Section title="Bankruptcy Status">
        <Row>
          <Field label="Currently in Bankruptcy?" name="isInBankruptcy" value={fields.isInBankruptcy} onChange={set} options={['Yes', 'No']} />
        </Row>
        {isInBankruptcy && (
          <>
            <Row>
              <Field label="Chapter" name="bankruptcyChapter" value={fields.bankruptcyChapter} onChange={set} options={BK_CHAPTERS} />
              <Field label="Filing Date" name="bkFilingDate" type="date" value={fields.bkFilingDate} onChange={set} />
              <Field label="Confirmation Date" name="bkConfirmationDate" type="date" value={fields.bkConfirmationDate} onChange={set} />
              <Field label="Dismissal Date" name="bkDismissalDate" type="date" value={fields.bkDismissalDate} onChange={set} />
            </Row>
            {fields.bankruptcyChapter === '13' && (
              <Row>
                <Field label="Ch.13 POC Filing Date" name="ch13PocFilingDate" type="date" value={fields.ch13PocFilingDate} onChange={set} />
                <Field label="Ch.13 Discharged Date" name="ch13DischargedDate" type="date" value={fields.ch13DischargedDate} onChange={set} />
              </Row>
            )}
          </>
        )}
      </Section>

      <button
        type="submit"
        className="btn btn--gold btn--full"
        disabled={loading}
        style={{ marginTop: '24px', padding: '16px' }}
      >
        {loading && <Spinner size={16} color="#0a0a0a" />}
        {loading ? 'Creating Listing…' : 'Create Listing →'}
      </button>
    </form>
  )
}
