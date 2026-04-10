'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Skeleton'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

// ── Field helpers ──────────────────────────────────────────────────────────────

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

const LOAN_STATUSES = ['Current', 'Past-Due', 'Default', 'Foreclosure', 'Bankruptcy', 'Modified']
const OCCUPANCY_TYPES = ['Owner Occupied', 'Non-Owner Occupied']
const BK_CHAPTERS = ['7', '11', '13']

// Section accordion
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
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
      {open && <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>{children}</div>}
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

type FieldOpts = {
  label: string
  k: string
  type?: string
  placeholder?: string
  options?: { label: string; value: string }[] | string[]
  textarea?: boolean
}

function FieldEl({ label, k, type = 'text', placeholder, options, textarea, value, onChange }: FieldOpts & {
  value: string
  onChange: (k: string, v: string) => void
}) {
  const normalizedOptions = options
    ? (options as (string | { label: string; value: string })[]).map((o) =>
        typeof o === 'string' ? { label: o, value: o } : o
      )
    : null

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label style={{ fontSize: '0.72rem' }}>{label}</label>
      {normalizedOptions ? (
        <select className="form-input" value={value} onChange={(e) => onChange(k, e.target.value)}>
          <option value="">Select…</option>
          {normalizedOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : textarea ? (
        <textarea className="form-input" rows={4} value={value} onChange={(e) => onChange(k, e.target.value)}
          placeholder={placeholder} style={{ resize: 'vertical' }} />
      ) : (
        <input type={type} className="form-input" value={value} onChange={(e) => onChange(k, e.target.value)}
          placeholder={placeholder} />
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const l = data.data
          const a = l.asset ?? {}

          const toStr = (v: unknown) => v == null ? '' : String(v)
          const toDateStr = (v: unknown) => {
            if (!v) return ''
            const d = new Date(v as string)
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
          }
          const toPct = (v: unknown) => {
            if (v == null || v === '') return ''
            const n = parseFloat(String(v))
            if (isNaN(n)) return ''
            return n <= 1 ? String(Math.round(n * 100)) : String(n)
          }

          setFields({
            // Listing
            title: toStr(l.title),
            assetType: toStr(l.assetType),
            lienPosition: toStr(l.lienPosition),
            unpaidBalance: toStr(l.unpaidBalance),
            loanCount: toStr(l.loanCount),
            avgDelinquency: toStr(l.avgDelinquency),
            status: toStr(l.status),
            description: toStr(l.description),
            dropboxLink: toStr(l.dropboxLink),
            // Property
            propertyStreet: toStr(a.propertyStreet),
            propertyCity: toStr(a.propertyCity),
            propertyState: toStr(a.propertyState),
            propertyZip: toStr(a.propertyZip),
            fairMarketValue: toStr(a.fairMarketValue),
            occupancyType: toStr(a.occupancyType),
            homePurchaseDate: toDateStr(a.homePurchaseDate),
            homePurchasePrice: toStr(a.homePurchasePrice),
            ltv: toPct(a.ltv),
            cltv: toPct(a.cltv),
            payoffCltv: toPct(a.payoffCltv),
            // First mortgage
            firstMtg_loanStatus: toStr(a.firstMtg_loanStatus),
            firstMtg_originalAmount: toStr(a.firstMtg_originalAmount),
            firstMtg_currentBalance: toStr(a.firstMtg_currentBalance),
            firstMtg_interestRate: toPct(a.firstMtg_interestRate),
            firstMtg_monthlyPI: toStr(a.firstMtg_monthlyPI),
            firstMtg_monthlyEscrow: toStr(a.firstMtg_monthlyEscrow),
            firstMtg_originationDate: toDateStr(a.firstMtg_originationDate),
            firstMtg_maturityDate: toDateStr(a.firstMtg_maturityDate),
            firstMtg_firstPaymentDate: toDateStr(a.firstMtg_firstPaymentDate),
            firstMtg_nextDueDate: toDateStr(a.firstMtg_nextDueDate),
            firstMtg_interestPaidToDate: toDateStr(a.firstMtg_interestPaidToDate),
            firstMtg_loanTermMonths: toStr(a.firstMtg_loanTermMonths),
            firstMtg_totalMonthsPaid: toStr(a.firstMtg_totalMonthsPaid),
            firstMtg_monthsRemaining: toStr(a.firstMtg_monthsRemaining),
            firstMtg_isModified: a.firstMtg_isModified === true ? 'Yes' : a.firstMtg_isModified === false ? 'No' : '',
            firstMtg_hasBalloon: a.firstMtg_hasBalloon === true ? 'Yes' : a.firstMtg_hasBalloon === false ? 'No' : '',
            firstMtg_balloonDate: toDateStr(a.firstMtg_balloonDate),
            firstMtg_modDate: toDateStr(a.firstMtg_modDate),
            firstMtg_modMaturityDate: toDateStr(a.firstMtg_modMaturityDate),
            firstMtg_modFirstPayDate: toDateStr(a.firstMtg_modFirstPayDate),
            firstMtg_modLoanAmount: toStr(a.firstMtg_modLoanAmount),
            firstMtg_modCurrentBalance: toStr(a.firstMtg_modCurrentBalance),
            firstMtg_modDeferredBalance: toStr(a.firstMtg_modDeferredBalance),
            firstMtg_modInterestRate: toPct(a.firstMtg_modInterestRate),
            firstMtg_modMonthlyPI: toStr(a.firstMtg_modMonthlyPI),
            firstMtg_modMonthlyEscrow: toStr(a.firstMtg_modMonthlyEscrow),
            firstMtg_modTermMonths: toStr(a.firstMtg_modTermMonths),
            firstMtg_modMonthsPaid: toStr(a.firstMtg_modMonthsPaid),
            firstMtg_modPaymentsRemaining: toStr(a.firstMtg_modPaymentsRemaining),
            firstMtg_modInterestPaidTo: toDateStr(a.firstMtg_modInterestPaidTo),
            firstMtg_foreclosureDefaultDate: toDateStr(a.firstMtg_foreclosureDefaultDate),
            firstMtg_foreclosureDefaultAmt: toStr(a.firstMtg_foreclosureDefaultAmt),
            firstMtg_foreclosureSaleDate: toDateStr(a.firstMtg_foreclosureSaleDate),
            // Second mortgage
            secondMtg_loanStatus: toStr(a.secondMtg_loanStatus),
            secondMtg_originalAmount: toStr(a.secondMtg_originalAmount),
            secondMtg_currentBalance: toStr(a.secondMtg_currentBalance),
            secondMtg_interestRate: toPct(a.secondMtg_interestRate),
            secondMtg_monthlyPI: toStr(a.secondMtg_monthlyPI),
            secondMtg_monthlyEscrow: toStr(a.secondMtg_monthlyEscrow),
            secondMtg_originationDate: toDateStr(a.secondMtg_originationDate),
            secondMtg_maturityDate: toDateStr(a.secondMtg_maturityDate),
            secondMtg_nextDueDate: toDateStr(a.secondMtg_nextDueDate),
            secondMtg_loanTermMonths: toStr(a.secondMtg_loanTermMonths),
            secondMtg_totalMonthsPaid: toStr(a.secondMtg_totalMonthsPaid),
            secondMtg_monthsRemaining: toStr(a.secondMtg_monthsRemaining),
            // Bankruptcy
            isInBankruptcy: a.isInBankruptcy === true ? 'Yes' : a.isInBankruptcy === false ? 'No' : '',
            bankruptcyChapter: toStr(a.bankruptcyChapter),
            bkFilingDate: toDateStr(a.bkFilingDate),
            ch13PocFilingDate: toDateStr(a.ch13PocFilingDate),
            bkConfirmationDate: toDateStr(a.bkConfirmationDate),
            bkDismissalDate: toDateStr(a.bkDismissalDate),
            ch13DischargedDate: toDateStr(a.ch13DischargedDate),
          })
        }
        setLoading(false)
      })
  }, [id])

  const set = (k: string, v: string) => setFields((prev) => ({ ...prev, [k]: v }))

  const F = (opts: FieldOpts) => (
    <FieldEl {...opts} value={fields[opts.k] ?? ''} onChange={set} />
  )

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const f = fields
    const num = (v: string) => v ? parseFloat(v.replace(/[$,%\s]/g, '')) || null : null
    const int = (v: string) => v ? parseInt(v) || null : null
    const pct = (v: string) => { const n = num(v); return n ? (n > 1 ? n / 100 : n) : null }
    const bool = (v: string) => v === 'Yes' ? true : v === 'No' ? false : null
    const dt = (v: string) => v || null

    const body = {
      // Listing fields
      title: f.title || undefined,
      assetType: f.assetType || undefined,
      lienPosition: f.lienPosition || null,
      unpaidBalance: num(f.unpaidBalance) ?? undefined,
      loanCount: int(f.loanCount) ?? undefined,
      avgDelinquency: f.avgDelinquency !== '' ? int(f.avgDelinquency) : null,
      status: f.status || undefined,
      description: f.description || null,
      dropboxLink: f.dropboxLink || null,
      // Property
      propertyStreet: f.propertyStreet || null,
      propertyCity: f.propertyCity || null,
      propertyState: f.propertyState || null,
      propertyZip: f.propertyZip || null,
      fairMarketValue: num(f.fairMarketValue),
      occupancyType: f.occupancyType || null,
      homePurchaseDate: dt(f.homePurchaseDate),
      homePurchasePrice: num(f.homePurchasePrice),
      ltv: pct(f.ltv),
      cltv: pct(f.cltv),
      payoffCltv: pct(f.payoffCltv),
      // First mortgage
      firstMtg_loanStatus: f.firstMtg_loanStatus || null,
      firstMtg_originalAmount: num(f.firstMtg_originalAmount),
      firstMtg_currentBalance: num(f.firstMtg_currentBalance),
      firstMtg_interestRate: pct(f.firstMtg_interestRate),
      firstMtg_monthlyPI: num(f.firstMtg_monthlyPI),
      firstMtg_monthlyEscrow: num(f.firstMtg_monthlyEscrow),
      firstMtg_originationDate: dt(f.firstMtg_originationDate),
      firstMtg_maturityDate: dt(f.firstMtg_maturityDate),
      firstMtg_firstPaymentDate: dt(f.firstMtg_firstPaymentDate),
      firstMtg_nextDueDate: dt(f.firstMtg_nextDueDate),
      firstMtg_interestPaidToDate: dt(f.firstMtg_interestPaidToDate),
      firstMtg_loanTermMonths: int(f.firstMtg_loanTermMonths),
      firstMtg_totalMonthsPaid: int(f.firstMtg_totalMonthsPaid),
      firstMtg_monthsRemaining: int(f.firstMtg_monthsRemaining),
      firstMtg_isModified: bool(f.firstMtg_isModified),
      firstMtg_hasBalloon: bool(f.firstMtg_hasBalloon),
      firstMtg_balloonDate: dt(f.firstMtg_balloonDate),
      firstMtg_modDate: dt(f.firstMtg_modDate),
      firstMtg_modMaturityDate: dt(f.firstMtg_modMaturityDate),
      firstMtg_modFirstPayDate: dt(f.firstMtg_modFirstPayDate),
      firstMtg_modLoanAmount: num(f.firstMtg_modLoanAmount),
      firstMtg_modCurrentBalance: num(f.firstMtg_modCurrentBalance),
      firstMtg_modDeferredBalance: num(f.firstMtg_modDeferredBalance),
      firstMtg_modInterestRate: pct(f.firstMtg_modInterestRate),
      firstMtg_modMonthlyPI: num(f.firstMtg_modMonthlyPI),
      firstMtg_modMonthlyEscrow: num(f.firstMtg_modMonthlyEscrow),
      firstMtg_modTermMonths: int(f.firstMtg_modTermMonths),
      firstMtg_modMonthsPaid: int(f.firstMtg_modMonthsPaid),
      firstMtg_modPaymentsRemaining: int(f.firstMtg_modPaymentsRemaining),
      firstMtg_modInterestPaidTo: dt(f.firstMtg_modInterestPaidTo),
      firstMtg_foreclosureDefaultDate: dt(f.firstMtg_foreclosureDefaultDate),
      firstMtg_foreclosureDefaultAmt: num(f.firstMtg_foreclosureDefaultAmt),
      firstMtg_foreclosureSaleDate: dt(f.firstMtg_foreclosureSaleDate),
      // Second mortgage
      secondMtg_loanStatus: f.secondMtg_loanStatus || null,
      secondMtg_originalAmount: num(f.secondMtg_originalAmount),
      secondMtg_currentBalance: num(f.secondMtg_currentBalance),
      secondMtg_interestRate: pct(f.secondMtg_interestRate),
      secondMtg_monthlyPI: num(f.secondMtg_monthlyPI),
      secondMtg_monthlyEscrow: num(f.secondMtg_monthlyEscrow),
      secondMtg_originationDate: dt(f.secondMtg_originationDate),
      secondMtg_maturityDate: dt(f.secondMtg_maturityDate),
      secondMtg_nextDueDate: dt(f.secondMtg_nextDueDate),
      secondMtg_loanTermMonths: int(f.secondMtg_loanTermMonths),
      secondMtg_totalMonthsPaid: int(f.secondMtg_totalMonthsPaid),
      secondMtg_monthsRemaining: int(f.secondMtg_monthsRemaining),
      // Bankruptcy
      isInBankruptcy: bool(f.isInBankruptcy),
      bankruptcyChapter: f.bankruptcyChapter || null,
      bkFilingDate: dt(f.bkFilingDate),
      ch13PocFilingDate: dt(f.ch13PocFilingDate),
      bkConfirmationDate: dt(f.bkConfirmationDate),
      bkDismissalDate: dt(f.bkDismissalDate),
      ch13DischargedDate: dt(f.ch13DischargedDate),
    }

    const res = await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)

    if (data.success) {
      router.push(`/listings/${id}`)
      router.refresh()
    } else {
      setError(data.error ?? 'Save failed.')
    }
  }

  const lienPos = fields.lienPosition
  const isModified = fields.firstMtg_isModified === 'Yes'
  const isInBankruptcy = fields.isInBankruptcy === 'Yes'

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

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}><Spinner size={24} /></div>

  return (
    <div style={{ maxWidth: '860px' }}>
      <Breadcrumbs
        items={[
          { label: 'Listings', href: '/listings' },
          { label: fields.title || 'Edit', href: `/listings/${id}` },
          { label: 'Edit' },
        ]}
      />

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: '28px' }}>
        Edit Listing
      </h1>

      {error && <div className="alert alert--error" style={{ marginBottom: '20px' }}>{error}</div>}

      {/* Listing Details */}
      <Section title="Listing Details" defaultOpen>
        <Row>
          {F({ label: 'Title', k: 'title' })}
          {F({ label: 'Asset Type', k: 'assetType', options: ['RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED'] })}
        </Row>
        <Row>
          {F({
            label: 'Lien Position', k: 'lienPosition',
            options: [{ label: 'First Lien (Senior)', value: 'SENIOR' }, { label: 'Second Lien (Junior)', value: 'JUNIOR' }],
          })}
          {F({ label: 'Status', k: 'status', options: ['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'PENDING', 'SOLD', 'ARCHIVED'] })}
        </Row>
        <Row>
          {F({ label: 'UPB (Unpaid Principal Balance)', k: 'unpaidBalance', type: 'number' })}
          {F({ label: 'Number of Loans', k: 'loanCount', type: 'number' })}
          {F({ label: 'Avg. Delinquency (months)', k: 'avgDelinquency', type: 'number' })}
        </Row>
        <Row>
          {F({ label: 'Description', k: 'description', textarea: true })}
        </Row>
        <Row>
          {F({ label: 'Dropbox Documents Link', k: 'dropboxLink', placeholder: 'https://www.dropbox.com/…' })}
        </Row>
      </Section>

      {/* Property Details */}
      <Section title="Property Details" defaultOpen>
        <Row>
          {F({ label: 'Street Address', k: 'propertyStreet', placeholder: '123 Main St' })}
          {F({ label: 'City', k: 'propertyCity', placeholder: 'Miami' })}
          {F({ label: 'State', k: 'propertyState', options: US_STATES })}
          {F({ label: 'Zip', k: 'propertyZip', placeholder: '33101' })}
        </Row>
        <Row>
          {F({ label: 'Fair Market Value ($)', k: 'fairMarketValue', placeholder: '250000' })}
          {F({ label: 'Occupancy Type', k: 'occupancyType', options: OCCUPANCY_TYPES })}
          {F({ label: 'Purchase Date', k: 'homePurchaseDate', type: 'date' })}
          {F({ label: 'Purchase Price ($)', k: 'homePurchasePrice', placeholder: '200000' })}
        </Row>
        <Row>
          {F({ label: 'LTV (%)', k: 'ltv', placeholder: '85' })}
          {F({ label: 'CLTV (%)', k: 'cltv', placeholder: '90' })}
          {F({ label: 'Payoff CLTV (%)', k: 'payoffCltv', placeholder: '95' })}
        </Row>
      </Section>

      {/* First Mortgage */}
      <Section title={subjectFirstLabel} defaultOpen>
        {lienPos === 'JUNIOR' && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', marginTop: '-4px' }}>
            Enter the senior lien details so buyers understand the full lien stack.
          </p>
        )}
        <Row>
          {F({ label: 'Loan Status', k: 'firstMtg_loanStatus', options: LOAN_STATUSES })}
          {F({ label: 'Original Loan Amount ($)', k: 'firstMtg_originalAmount', placeholder: '200000' })}
          {F({ label: 'UPB (Unpaid Principal Balance) ($)', k: 'firstMtg_currentBalance', placeholder: '185000' })}
        </Row>
        <Row>
          {F({ label: 'Interest Rate (%)', k: 'firstMtg_interestRate', placeholder: '6.5' })}
          {F({ label: 'Monthly P&I ($)', k: 'firstMtg_monthlyPI', placeholder: '1264' })}
          {F({ label: 'Monthly Escrow ($)', k: 'firstMtg_monthlyEscrow', placeholder: '350' })}
        </Row>
        <Row>
          {F({ label: 'Origination Date', k: 'firstMtg_originationDate', type: 'date' })}
          {F({ label: 'Maturity Date', k: 'firstMtg_maturityDate', type: 'date' })}
          {F({ label: 'First Payment Date', k: 'firstMtg_firstPaymentDate', type: 'date' })}
          {F({ label: 'Next Due Date', k: 'firstMtg_nextDueDate', type: 'date' })}
        </Row>
        <Row>
          {F({ label: 'Loan Term (months)', k: 'firstMtg_loanTermMonths', type: 'number', placeholder: '360' })}
          {F({ label: 'Months Paid', k: 'firstMtg_totalMonthsPaid', type: 'number', placeholder: '48' })}
          {F({ label: 'Months Remaining', k: 'firstMtg_monthsRemaining', type: 'number', placeholder: '312' })}
          {F({ label: 'Interest Paid To Date', k: 'firstMtg_interestPaidToDate', type: 'date' })}
        </Row>
        <Row>
          {F({ label: 'Has Been Modified?', k: 'firstMtg_isModified', options: ['Yes', 'No'] })}
        </Row>
      </Section>

      {/* Modification — only if modified */}
      {isModified && (
        <Section title="First Mortgage — Modification Terms" defaultOpen>
          <Row>
            {F({ label: 'Modification Date', k: 'firstMtg_modDate', type: 'date' })}
            {F({ label: 'Mod Maturity Date', k: 'firstMtg_modMaturityDate', type: 'date' })}
            {F({ label: 'Mod First Payment Date', k: 'firstMtg_modFirstPayDate', type: 'date' })}
            {F({ label: 'Has Balloon?', k: 'firstMtg_hasBalloon', options: ['Yes', 'No'] })}
          </Row>
          {fields.firstMtg_hasBalloon === 'Yes' && (
            <Row>{F({ label: 'Balloon Date', k: 'firstMtg_balloonDate', type: 'date' })}</Row>
          )}
          <Row>
            {F({ label: 'Mod Loan Amount ($)', k: 'firstMtg_modLoanAmount', placeholder: '180000' })}
            {F({ label: 'Mod UPB ($)', k: 'firstMtg_modCurrentBalance', placeholder: '175000' })}
            {F({ label: 'Deferred Balance ($)', k: 'firstMtg_modDeferredBalance', placeholder: '0' })}
          </Row>
          <Row>
            {F({ label: 'Mod Interest Rate (%)', k: 'firstMtg_modInterestRate', placeholder: '4.0' })}
            {F({ label: 'Mod Monthly P&I ($)', k: 'firstMtg_modMonthlyPI', placeholder: '950' })}
            {F({ label: 'Mod Monthly Escrow ($)', k: 'firstMtg_modMonthlyEscrow', placeholder: '350' })}
          </Row>
          <Row>
            {F({ label: 'Mod Term (months)', k: 'firstMtg_modTermMonths', type: 'number' })}
            {F({ label: 'Mod Months Paid', k: 'firstMtg_modMonthsPaid', type: 'number' })}
            {F({ label: 'Mod Payments Remaining', k: 'firstMtg_modPaymentsRemaining', type: 'number' })}
            {F({ label: 'Mod Interest Paid To', k: 'firstMtg_modInterestPaidTo', type: 'date' })}
          </Row>
        </Section>
      )}

      {/* Foreclosure */}
      <Section title="First Mortgage — Foreclosure Status">
        <Row>
          {F({ label: 'Notice of Default Date', k: 'firstMtg_foreclosureDefaultDate', type: 'date' })}
          {F({ label: 'Default Amount ($)', k: 'firstMtg_foreclosureDefaultAmt', placeholder: '0' })}
          {F({ label: 'Notice of Sale Date', k: 'firstMtg_foreclosureSaleDate', type: 'date' })}
        </Row>
      </Section>

      {/* Second Mortgage */}
      <Section title={subjectSecondLabel}>
        {lienPos === 'SENIOR' && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', marginTop: '-4px' }}>
            Enter the junior lien details so buyers understand the full lien stack.
          </p>
        )}
        <Row>
          {F({ label: 'Loan Status', k: 'secondMtg_loanStatus', options: LOAN_STATUSES })}
          {F({ label: 'Original Amount ($)', k: 'secondMtg_originalAmount', placeholder: '50000' })}
          {F({ label: 'UPB (Unpaid Principal Balance) ($)', k: 'secondMtg_currentBalance', placeholder: '45000' })}
        </Row>
        <Row>
          {F({ label: 'Interest Rate (%)', k: 'secondMtg_interestRate', placeholder: '7.5' })}
          {F({ label: 'Monthly P&I ($)', k: 'secondMtg_monthlyPI' })}
          {F({ label: 'Monthly Escrow ($)', k: 'secondMtg_monthlyEscrow' })}
        </Row>
        <Row>
          {F({ label: 'Origination Date', k: 'secondMtg_originationDate', type: 'date' })}
          {F({ label: 'Maturity Date', k: 'secondMtg_maturityDate', type: 'date' })}
          {F({ label: 'Next Due Date', k: 'secondMtg_nextDueDate', type: 'date' })}
        </Row>
        <Row>
          {F({ label: 'Loan Term (months)', k: 'secondMtg_loanTermMonths', type: 'number' })}
          {F({ label: 'Months Paid', k: 'secondMtg_totalMonthsPaid', type: 'number' })}
          {F({ label: 'Months Remaining', k: 'secondMtg_monthsRemaining', type: 'number' })}
        </Row>
      </Section>

      {/* Bankruptcy */}
      <Section title="Bankruptcy Status">
        <Row>
          {F({ label: 'Currently in Bankruptcy?', k: 'isInBankruptcy', options: ['Yes', 'No'] })}
        </Row>
        {isInBankruptcy && (
          <>
            <Row>
              {F({ label: 'Chapter', k: 'bankruptcyChapter', options: BK_CHAPTERS })}
              {F({ label: 'Filing Date', k: 'bkFilingDate', type: 'date' })}
              {F({ label: 'Confirmation Date', k: 'bkConfirmationDate', type: 'date' })}
              {F({ label: 'Dismissal Date', k: 'bkDismissalDate', type: 'date' })}
            </Row>
            {fields.bankruptcyChapter === '13' && (
              <Row>
                {F({ label: 'Ch.13 POC Filing Date', k: 'ch13PocFilingDate', type: 'date' })}
                {F({ label: 'Ch.13 Discharged Date', k: 'ch13DischargedDate', type: 'date' })}
              </Row>
            )}
          </>
        )}
      </Section>

      {/* Save / Cancel */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button className="btn btn--gold" onClick={handleSave} disabled={saving}>
          {saving && <Spinner size={14} color="#0a0a0a" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <Link href={`/listings/${id}`} className="btn btn--ghost">Cancel</Link>
      </div>
    </div>
  )
}
