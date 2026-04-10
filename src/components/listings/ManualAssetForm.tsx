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
  options?: { label: string; value: string }[] | string[]
}) {
  const normalizedOptions = options
    ? (options as (string | { label: string; value: string })[]).map((o) =>
        typeof o === 'string' ? { label: o, value: o } : o
      )
    : null

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label style={{ fontSize: '0.72rem' }}>{label}{required && ' *'}</label>
      {normalizedOptions ? (
        <select className="form-input" value={value} onChange={(e) => onChange(name, e.target.value)}>
          <option value="">Select…</option>
          {normalizedOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

// ── Constants ──────────────────────────────────────────────────────────────────

const LOAN_STATUSES = ['Current', 'Past-Due', 'Default', 'Foreclosure', 'Bankruptcy', 'Modified']
const OCCUPANCY_TYPES = ['Owner Occupied', 'Non-Owner Occupied']
const BK_CHAPTERS = ['7', '11', '13']

const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' }, { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' }, { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' }, { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' }, { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' }, { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' }, { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
]

// ── Main component ─────────────────────────────────────────────────────────────

export function ManualAssetForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState<Record<string, string>>({
    // Listing
    title: '',
    assetType: 'RESIDENTIAL',
    lienPosition: '',
    // Property
    propertyStreet: '', propertyCity: '', propertyState: '', propertyZip: '',
    fairMarketValue: '', occupancyType: '', homePurchaseDate: '', homePurchasePrice: '',
    ltv: '', cltv: '', payoffCltv: '',
    // Subject / First mortgage (used as subject when lien=FIRST, or as first-position context when lien=SECOND)
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

    if (!fields.propertyStreet) { setError('Street address is required.'); return }
    if (!fields.propertyCity)   { setError('City is required.'); return }
    if (!fields.propertyState)  { setError('State is required.'); return }
    if (!fields.propertyZip)    { setError('Zip code is required.'); return }
    if (!fields.firstMtg_currentBalance && fields.lienPosition !== 'JUNIOR') {
      setError('Subject loan UPB is required.')
      return
    }
    if (!fields.secondMtg_currentBalance && fields.lienPosition === 'JUNIOR') {
      setError('Subject loan UPB is required.')
      return
    }

    setLoading(true)

    const parseNum = (v: string) => v ? parseFloat(v.replace(/[$,%,\s]/g, '')) || null : null
    const parseInt2 = (v: string) => v ? parseInt(v) || null : null
    const parseBool = (v: string) => v === 'Yes' ? true : v === 'No' ? false : null
    const parseDate = (v: string) => v || null
    const pct = (v: string) => { const n = parseNum(v); return n ? (n > 1 ? n / 100 : n) : null }

    const body = {
      title: fields.title || [fields.propertyStreet, fields.propertyCity, fields.propertyState].filter(Boolean).join(', ') || 'Manual Entry',
      assetType: fields.assetType || 'RESIDENTIAL',
      lienPosition: fields.lienPosition || null,
      propertyStreet: fields.propertyStreet || null,
      propertyCity: fields.propertyCity || null,
      propertyState: fields.propertyState || null,
      propertyZip: fields.propertyZip || null,
      fairMarketValue: parseNum(fields.fairMarketValue),
      occupancyType: fields.occupancyType || null,
      homePurchaseDate: parseDate(fields.homePurchaseDate),
      homePurchasePrice: parseNum(fields.homePurchasePrice),
      ltv: pct(fields.ltv),
      cltv: pct(fields.cltv),
      payoffCltv: pct(fields.payoffCltv),
      firstMtg_loanStatus: fields.firstMtg_loanStatus || null,
      firstMtg_originalAmount: parseNum(fields.firstMtg_originalAmount),
      firstMtg_currentBalance: parseNum(fields.firstMtg_currentBalance),
      firstMtg_interestRate: pct(fields.firstMtg_interestRate),
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
      firstMtg_modInterestRate: pct(fields.firstMtg_modInterestRate),
      firstMtg_modMonthlyPI: parseNum(fields.firstMtg_modMonthlyPI),
      firstMtg_modMonthlyEscrow: parseNum(fields.firstMtg_modMonthlyEscrow),
      firstMtg_modTermMonths: parseInt2(fields.firstMtg_modTermMonths),
      firstMtg_modMonthsPaid: parseInt2(fields.firstMtg_modMonthsPaid),
      firstMtg_modPaymentsRemaining: parseInt2(fields.firstMtg_modPaymentsRemaining),
      firstMtg_modInterestPaidTo: parseDate(fields.firstMtg_modInterestPaidTo),
      firstMtg_foreclosureDefaultDate: parseDate(fields.firstMtg_foreclosureDefaultDate),
      firstMtg_foreclosureDefaultAmt: parseNum(fields.firstMtg_foreclosureDefaultAmt),
      firstMtg_foreclosureSaleDate: parseDate(fields.firstMtg_foreclosureSaleDate),
      secondMtg_loanStatus: fields.secondMtg_loanStatus || null,
      secondMtg_originalAmount: parseNum(fields.secondMtg_originalAmount),
      secondMtg_currentBalance: parseNum(fields.secondMtg_currentBalance),
      secondMtg_interestRate: pct(fields.secondMtg_interestRate),
      secondMtg_monthlyPI: parseNum(fields.secondMtg_monthlyPI),
      secondMtg_monthlyEscrow: parseNum(fields.secondMtg_monthlyEscrow),
      secondMtg_originationDate: parseDate(fields.secondMtg_originationDate),
      secondMtg_maturityDate: parseDate(fields.secondMtg_maturityDate),
      secondMtg_nextDueDate: parseDate(fields.secondMtg_nextDueDate),
      secondMtg_loanTermMonths: parseInt2(fields.secondMtg_loanTermMonths),
      secondMtg_totalMonthsPaid: parseInt2(fields.secondMtg_totalMonthsPaid),
      secondMtg_monthsRemaining: parseInt2(fields.secondMtg_monthsRemaining),
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
  const isInBankruptcy = fields.isInBankruptcy === 'Yes'
  const lienPos = fields.lienPosition // '' | 'SENIOR' | 'JUNIOR'

  // Section label logic based on lien position
  const subjectFirstLabel = lienPos === 'JUNIOR'
    ? 'First Mortgage on Subject Property (Senior Lien)'
    : lienPos === 'SENIOR'
    ? 'Subject Loan — First Mortgage'
    : 'First Mortgage — Current Loan'

  const subjectSecondLabel = lienPos === 'SENIOR'
    ? 'Second Mortgage on Subject Property (Junior Lien)'
    : lienPos === 'JUNIOR'
    ? 'Subject Loan — Second Mortgage'
    : 'Second Mortgage'

  const subjectFirstHint = lienPos === 'JUNIOR'
    ? 'Enter the senior lien details so buyers understand the full lien stack.'
    : null

  const subjectSecondHint = lienPos === 'SENIOR'
    ? 'Enter the junior lien details so buyers understand the full lien stack.'
    : null

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert--error" style={{ marginBottom: '20px' }}>{error}</div>}

      {/* Listing title + type + lien position */}
      <Section title="Listing Details" defaultOpen>
        <Row>
          <Field label="Listing Title" name="title" value={fields.title} onChange={set} placeholder="Auto-generated from address if blank" />
          <Field label="Asset Type" name="assetType" value={fields.assetType} onChange={set}
            options={['RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED']} />
        </Row>
        <Row>
          <Field
            label="Lien Position *"
            name="lienPosition"
            value={fields.lienPosition}
            onChange={set}
            options={[
              { label: 'First Lien (Senior)', value: 'SENIOR' },
              { label: 'Second Lien (Junior)', value: 'JUNIOR' },
            ]}
            required
          />
        </Row>
      </Section>

      {/* Property */}
      <Section title="Property Details" defaultOpen>
        <Row>
          <Field label="Street Address" name="propertyStreet" value={fields.propertyStreet} onChange={set} placeholder="123 Main St" required />
          <Field label="City" name="propertyCity" value={fields.propertyCity} onChange={set} placeholder="Miami" required />
          <Field label="State" name="propertyState" value={fields.propertyState} onChange={set} options={US_STATES} required />
          <Field label="Zip" name="propertyZip" value={fields.propertyZip} onChange={set} placeholder="33101" required />
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

      {/* First Mortgage section — always shown, label adapts */}
      <Section title={subjectFirstLabel} defaultOpen>
        {subjectFirstHint && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', marginTop: '-4px' }}>
            {subjectFirstHint}
          </p>
        )}
        <Row>
          <Field label="Loan Status" name="firstMtg_loanStatus" value={fields.firstMtg_loanStatus} onChange={set} options={LOAN_STATUSES} />
          <Field label="Original Loan Amount ($)" name="firstMtg_originalAmount" value={fields.firstMtg_originalAmount} onChange={set} placeholder="200000" />
          <Field
            label={lienPos === 'JUNIOR' ? 'UPB (Unpaid Principal Balance) ($)' : 'UPB (Unpaid Principal Balance) ($) *'}
            name="firstMtg_currentBalance"
            value={fields.firstMtg_currentBalance}
            onChange={set}
            placeholder="185000"
            required={lienPos !== 'JUNIOR'}
          />
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
        {/* Modification toggle — only on the subject first lien */}
        {lienPos !== 'JUNIOR' && (
          <Row>
            <Field label="Has Been Modified?" name="firstMtg_isModified" value={fields.firstMtg_isModified} onChange={set} options={['Yes', 'No']} />
          </Row>
        )}
      </Section>

      {/* Modification — only when lien=SENIOR (or unselected) and modified */}
      {lienPos !== 'JUNIOR' && isModified && (
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

      {/* Foreclosure — always shown for first lien context */}
      <Section title={lienPos === 'JUNIOR' ? 'First Mortgage — Foreclosure Status' : 'First Mortgage — Foreclosure Status'}>
        <Row>
          <Field label="Notice of Default Date" name="firstMtg_foreclosureDefaultDate" type="date" value={fields.firstMtg_foreclosureDefaultDate} onChange={set} />
          <Field label="Default Amount ($)" name="firstMtg_foreclosureDefaultAmt" value={fields.firstMtg_foreclosureDefaultAmt} onChange={set} placeholder="0" />
          <Field label="Notice of Sale Date" name="firstMtg_foreclosureSaleDate" type="date" value={fields.firstMtg_foreclosureSaleDate} onChange={set} />
        </Row>
      </Section>

      {/* Second Mortgage section — always shown, label adapts */}
      <Section title={subjectSecondLabel}>
        {subjectSecondHint && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', marginTop: '-4px' }}>
            {subjectSecondHint}
          </p>
        )}
        <Row>
          <Field label="Loan Status" name="secondMtg_loanStatus" value={fields.secondMtg_loanStatus} onChange={set} options={LOAN_STATUSES} />
          <Field label="Original Amount ($)" name="secondMtg_originalAmount" value={fields.secondMtg_originalAmount} onChange={set} placeholder="50000" />
          <Field
            label={lienPos === 'JUNIOR' ? 'UPB (Unpaid Principal Balance) ($) *' : 'UPB (Unpaid Principal Balance) ($)'}
            name="secondMtg_currentBalance"
            value={fields.secondMtg_currentBalance}
            onChange={set}
            placeholder="45000"
            required={lienPos === 'JUNIOR'}
          />
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
