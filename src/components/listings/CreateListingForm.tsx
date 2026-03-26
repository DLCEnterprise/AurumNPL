'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

type Step = 1 | 2 | 3 | 4

interface FormData {
  // Step 1
  title: string
  description: string
  assetType: string
  dropboxLink: string
  // Step 2
  lienPosition: string
  unpaidBalance: string
  loanCount: string
  avgDelinquency: string
  // Step 3
  location: string
  region: string
  // Step 4 review — no new fields
  status: 'DRAFT' | 'ACTIVE'
}

const STEPS = [
  { num: 1 as Step, label: 'Basic Info' },
  { num: 2 as Step, label: 'Financials' },
  { num: 3 as Step, label: 'Location' },
  { num: 4 as Step, label: 'Review' },
]

export function CreateListingForm() {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>({
    title: '', description: '', assetType: 'RESIDENTIAL', dropboxLink: '',
    lienPosition: '',
    unpaidBalance: '', loanCount: '', avgDelinquency: '',
    location: '', region: '',
    status: 'ACTIVE',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((p) => ({ ...p, [key]: e.target.value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const validateStep = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (step === 1) {
      if (form.title.trim().length < 5) e.title = 'Title must be at least 5 characters.'
      if (!form.assetType) e.assetType = 'Asset type is required.'
    }
    if (step === 2) {
      if (!form.lienPosition) e.lienPosition = 'Lien position is required.'
      if (!form.unpaidBalance || isNaN(parseFloat(form.unpaidBalance)) || parseFloat(form.unpaidBalance) <= 0)
        e.unpaidBalance = 'Enter a valid UPB amount.'
      if (!form.loanCount || isNaN(parseInt(form.loanCount)) || parseInt(form.loanCount) <= 0)
        e.loanCount = 'Enter a valid loan count.'
    }
    if (step === 3) {
      if (!form.location.trim()) e.location = 'Location is required.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validateStep()) setStep((s) => (s < 4 ? ((s + 1) as Step) : s))
  }
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))

  const submit = async (status: 'DRAFT' | 'ACTIVE') => {
    setLoading(true)

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:          form.title.trim(),
        description:    form.description.trim() || undefined,
        assetType:      form.assetType,
        unpaidBalance:  parseFloat(form.unpaidBalance),
        loanCount:      parseInt(form.loanCount),
        avgDelinquency: form.avgDelinquency ? parseInt(form.avgDelinquency) : undefined,
        location:       form.location.trim(),
        region:         form.region.trim() || undefined,
        status,
        ...(form.dropboxLink ? { dropboxLink: form.dropboxLink } : {}),
        ...(form.lienPosition ? { lienPosition: form.lienPosition } : {}),
      }),
    })

    setLoading(false)
    const data = await res.json()

    if (!res.ok || !data.success) {
      toast.error(data.error ?? 'Failed to create listing.')
      if (data.fieldErrors) setErrors(data.fieldErrors)
      return
    }

    router.push(`/listings/${data.data.id}`)
  }

  const upbFormatted = form.unpaidBalance
    ? `$${parseFloat(form.unpaidBalance).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—'

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '36px' }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
                background: step > s.num
                  ? 'var(--gold-gradient)'
                  : step === s.num
                  ? 'rgba(212,168,70,0.15)'
                  : 'var(--bg-elevated)',
                border: step >= s.num
                  ? '1px solid rgba(212,168,70,0.4)'
                  : '1px solid var(--border-light)',
                color: step > s.num ? '#0a0a0a' : step === s.num ? 'var(--gold-300)' : 'var(--text-muted)',
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.68rem', color: step >= s.num ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: step > s.num ? 'rgba(212,168,70,0.3)' : 'var(--border)', margin: '0 8px', marginBottom: '22px' }} />
            )}
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '36px' }}>
        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>
              Basic Information
            </h2>
            <div className="form-group">
              <label htmlFor="title">Listing Title *</label>
              <input id="title" type="text" className={`form-input${errors.title ? ' form-input--error' : ''}`}
                placeholder="e.g. Southeast Residential NPL Portfolio" value={form.title} onChange={set('title')} />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="assetType">Asset Type *</label>
              <select id="assetType" className="form-input" value={form.assetType} onChange={set('assetType')}>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="CONSUMER">Consumer</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" className="form-input" rows={4}
                placeholder="Describe the portfolio, collateral characteristics, servicing history, or other relevant details…"
                value={form.description} onChange={set('description')}
                style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label htmlFor="dropboxLink">Dropbox Documents Link</label>
              <input id="dropboxLink" type="url" className="form-input"
                placeholder="https://www.dropbox.com/…"
                value={form.dropboxLink} onChange={set('dropboxLink')} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Only shared with buyers whose bids you accept.
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: Financials ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>
              Financial Details
            </h2>
            <div className="form-group">
              <label htmlFor="lienPosition">Lien Position *</label>
              <select id="lienPosition" className={`form-input${errors.lienPosition ? ' form-input--error' : ''}`}
                value={form.lienPosition} onChange={set('lienPosition')}>
                <option value="">Select lien position…</option>
                <option value="SENIOR">Senior (1st Mortgage)</option>
                <option value="JUNIOR">Junior (2nd Mortgage)</option>
              </select>
              {errors.lienPosition && <span className="form-error">{errors.lienPosition}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="unpaidBalance">Unpaid Principal Balance (UPB) *</label>
              <input id="unpaidBalance" type="number" min="1" step="1000" className={`form-input${errors.unpaidBalance ? ' form-input--error' : ''}`}
                placeholder="e.g. 18400000" value={form.unpaidBalance} onChange={set('unpaidBalance')} />
              {form.unpaidBalance && !errors.unpaidBalance && (
                <span style={{ fontSize: '0.78rem', color: 'var(--gold-300)', marginTop: '4px' }}>
                  {upbFormatted}
                </span>
              )}
              {errors.unpaidBalance && <span className="form-error">{errors.unpaidBalance}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="loanCount">Number of Loans *</label>
                <input id="loanCount" type="number" min="1" className={`form-input${errors.loanCount ? ' form-input--error' : ''}`}
                  placeholder="e.g. 127" value={form.loanCount} onChange={set('loanCount')} />
                {errors.loanCount && <span className="form-error">{errors.loanCount}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="avgDelinquency">Avg. Delinquency (months)</label>
                <input id="avgDelinquency" type="number" min="0" className="form-input"
                  placeholder="e.g. 18" value={form.avgDelinquency} onChange={set('avgDelinquency')} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Location ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>
              Geography
            </h2>
            <div className="form-group">
              <label htmlFor="location">State(s) / Location *</label>
              <input id="location" type="text" className={`form-input${errors.location ? ' form-input--error' : ''}`}
                placeholder="e.g. FL, GA, SC" value={form.location} onChange={set('location')} />
              {errors.location && <span className="form-error">{errors.location}</span>}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Use state abbreviations separated by commas, or &quot;Nationwide&quot;
              </span>
            </div>
            <div className="form-group">
              <label htmlFor="region">Region</label>
              <select id="region" className="form-input" value={form.region} onChange={set('region')}>
                <option value="">Select region…</option>
                <option value="Northeast">Northeast</option>
                <option value="Southeast">Southeast</option>
                <option value="Midwest">Midwest</option>
                <option value="West">West</option>
                <option value="Southwest">Southwest</option>
                <option value="Nationwide">Nationwide</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '24px' }}>
              Review & Submit
            </h2>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
              {[
                { label: 'Title', value: form.title },
                { label: 'Asset Type', value: form.assetType },
                { label: 'Lien Position', value: form.lienPosition === 'SENIOR' ? 'Senior (1st Mortgage)' : form.lienPosition === 'JUNIOR' ? 'Junior (2nd Mortgage)' : '—' },
                { label: 'UPB', value: upbFormatted },
                { label: 'Loan Count', value: form.loanCount },
                { label: 'Avg. Delinquency', value: form.avgDelinquency ? `${form.avgDelinquency} months` : '—' },
                { label: 'Location', value: form.location },
                { label: 'Region', value: form.region || '—' },
                ...(form.description ? [{ label: 'Description', value: form.description }] : []),
                ...(form.dropboxLink ? [{ label: 'Dropbox Link', value: 'Provided' }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', minWidth: '140px' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{value}</span>
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
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn--ghost" onClick={back} disabled={step === 1}>
              ← Back
            </button>
            <button className="btn btn--gold" onClick={next}>
              Continue →
            </button>
          </div>
        )}
        {step === 4 && (
          <div style={{ marginTop: '12px' }}>
            <button className="btn btn--ghost btn--sm" onClick={back}>← Back to Edit</button>
          </div>
        )}
      </div>
    </div>
  )
}
