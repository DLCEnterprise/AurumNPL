'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Skeleton'

interface FormState {
  name: string
  email: string
  password: string
  confirmPassword: string
  company: string
  phone: string
  role: 'SELLER' | 'BUYER' | 'BOTH'
  terms: boolean
  // Buyer / investor fields
  entityName: string
  signerTitle: string
  yearsExperience: string
  investorType: string
  lienPosition: string
  loanStatusPref: string
  mainObjective: string
}

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  company?: string
  terms?: string
}

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'transparent' }
  let score = 0
  if (pw.length >= 8)            score++
  if (/[A-Z]/.test(pw))         score++
  if (/[0-9]/.test(pw))         score++
  if (/[^A-Za-z0-9]/.test(pw))  score++
  if (score === 1) return { score, label: 'Weak',   color: '#f87171' }
  if (score === 2) return { score, label: 'Fair',   color: '#fb923c' }
  if (score === 3) return { score, label: 'Good',   color: '#fbbf24' }
  return                         { score, label: 'Strong', color: '#34d399' }
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = 'Full name is required.'
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'A valid email address is required.'
  if (!PASSWORD_REGEX.test(form.password))
    errors.password = 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.'
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = 'Passwords do not match.'
  if (!form.company.trim()) errors.company = 'Company name is required.'
  if (!form.terms) errors.terms = 'You must accept the Terms of Service to continue.'
  return errors
}

const INVESTOR_TYPES = ['Private Investor', 'Fund Manager', 'Partner']
const LIEN_POSITIONS = ['First Mortgage', 'Second/HELOC', 'Both']
const LOAN_STATUS_PREFS = ['Performing', 'Non-Performing', 'Both']
const MAIN_OBJECTIVES = ['Cash Flow', 'Quick Payoff / Short Pay', 'Obtain Real Estate']

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', confirmPassword: '',
    company: '', phone: '', role: 'SELLER', terms: false,
    entityName: '', signerTitle: '', yearsExperience: '',
    investorType: '', lienPosition: '', loanStatusPref: '', mainObjective: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setLoading(true)

    // "Both" → primary role SELLER, request BUYER access pending admin review
    const primaryRole = form.role === 'BOTH' ? 'SELLER' : form.role
    const pendingRoleRequest = form.role === 'BOTH' ? 'BUYER' : undefined

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      company: form.company.trim(),
      phone: form.phone.trim() || undefined,
      role: primaryRole,
      pendingRoleRequest,
    }

    if (form.role === 'BUYER' || form.role === 'BOTH') {
      if (form.entityName.trim()) body.entityName = form.entityName.trim()
      if (form.signerTitle.trim()) body.signerTitle = form.signerTitle.trim()
      if (form.yearsExperience) body.yearsExperience = parseInt(form.yearsExperience)
      if (form.investorType) body.investorType = form.investorType
      if (form.lienPosition) body.lienPosition = form.lienPosition
      if (form.loanStatusPref) body.loanStatusPref = form.loanStatusPref
      if (form.mainObjective) body.mainObjective = form.mainObjective
    }

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      const mins = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 15
      setServerError(`Too many sign-up attempts. Please try again in ${mins} minute${mins !== 1 ? 's' : ''}.`)
      return
    }

    const data = await res.json()
    if (!res.ok || !data.success) {
      setServerError(data.error ?? 'Registration failed. Please try again.')
      if (data.fieldErrors) setFieldErrors(data.fieldErrors)
      return
    }
    router.push('/pending-approval')
  }

  return (
    <div className="auth-page" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
      <div className="auth-card glass-card" style={{ maxWidth: '520px' }}>
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon">◈</span>
          <span className="auth-card__logo-text">AURUM</span>
        </div>

        <h1>Request Access</h1>
        <p className="auth-card__subtitle">
          Apply for an institutional account. Subject to eligibility review.
        </p>

        {serverError && (
          <div className="alert alert--error" role="alert">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role selector */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>I am a</label>
            <div className="role-toggle">
              <div className="role-option">
                <input type="radio" id="role-seller" name="role" value="SELLER"
                  checked={form.role === 'SELLER'}
                  onChange={() => setForm((p) => ({ ...p, role: 'SELLER' }))} />
                <label htmlFor="role-seller">Seller<span>List NPL portfolios</span></label>
              </div>
              <div className="role-option">
                <input type="radio" id="role-buyer" name="role" value="BUYER"
                  checked={form.role === 'BUYER'}
                  onChange={() => setForm((p) => ({ ...p, role: 'BUYER' }))} />
                <label htmlFor="role-buyer">Buyer<span>Acquire distressed debt</span></label>
              </div>
              <div className="role-option">
                <input type="radio" id="role-both" name="role" value="BOTH"
                  checked={form.role === 'BOTH'}
                  onChange={() => setForm((p) => ({ ...p, role: 'BOTH' }))} />
                <label htmlFor="role-both">Both<span>Buy &amp; sell NPL notes</span></label>
              </div>
            </div>
            {form.role === 'BOTH' && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                You&apos;ll be registered as a Seller. Buyer access will be reviewed and granted by our team.
              </p>
            )}
          </div>

          {/* Core fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input id="name" type="text" className={`form-input${fieldErrors.name ? ' form-input--error' : ''}`}
                placeholder="Jane Smith" value={form.name} onChange={set('name')} autoComplete="name" />
              {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="company">Company *</label>
              <input id="company" type="text" className={`form-input${fieldErrors.company ? ' form-input--error' : ''}`}
                placeholder="Acme Capital" value={form.company} onChange={set('company')} autoComplete="organization" />
              {fieldErrors.company && <span className="form-error">{fieldErrors.company}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Work Email *</label>
            <input id="email" type="email" className={`form-input${fieldErrors.email ? ' form-input--error' : ''}`}
              placeholder="jane@acmecapital.com" value={form.email} onChange={set('email')} autoComplete="email" />
            {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" type="tel" className="form-input" placeholder="+1 (555) 000-0000"
              value={form.phone} onChange={set('phone')} autoComplete="tel" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input id="password" type="password" className={`form-input${fieldErrors.password ? ' form-input--error' : ''}`}
              placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special" value={form.password} onChange={set('password')} autoComplete="new-password" />
            {form.password && (() => {
              const { score, label, color } = getPasswordStrength(form.password)
              return (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: i <= score ? color : 'var(--border-light)',
                        transition: 'background 0.25s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.7rem', color, fontWeight: 500 }}>{label}</span>
                </div>
              )
            })()}
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input id="confirmPassword" type="password" className={`form-input${fieldErrors.confirmPassword ? ' form-input--error' : ''}`}
              placeholder="Re-enter your password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
            {form.confirmPassword && !fieldErrors.confirmPassword && (
              <div style={{ marginTop: '4px', fontSize: '0.72rem', fontWeight: 500,
                color: form.password === form.confirmPassword ? '#34d399' : '#f87171' }}>
                {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
            {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
          </div>

          {/* Buyer / Investor additional fields */}
          {(form.role === 'BUYER' || form.role === 'BOTH') && (
            <div style={{ marginTop: '4px', marginBottom: '4px' }}>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0 20px' }} />
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Investor Profile (optional)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="entityName">Entity Name</label>
                  <input id="entityName" type="text" className="form-input" placeholder="Acme Capital LLC"
                    value={form.entityName} onChange={set('entityName')} />
                </div>
                <div className="form-group">
                  <label htmlFor="signerTitle">Signer&apos;s Title</label>
                  <input id="signerTitle" type="text" className="form-input" placeholder="Managing Director"
                    value={form.signerTitle} onChange={set('signerTitle')} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="yearsExperience">Years of Experience</label>
                  <input id="yearsExperience" type="number" min="0" className="form-input" placeholder="10"
                    value={form.yearsExperience} onChange={set('yearsExperience')} />
                </div>
                <div className="form-group">
                  <label htmlFor="investorType">Investor Type</label>
                  <select id="investorType" className="form-input" value={form.investorType} onChange={set('investorType')}>
                    <option value="">Select…</option>
                    {INVESTOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="lienPosition">Lien Position</label>
                  <select id="lienPosition" className="form-input" value={form.lienPosition} onChange={set('lienPosition')}>
                    <option value="">Select…</option>
                    {LIEN_POSITIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="loanStatusPref">Loan Status Preference</label>
                  <select id="loanStatusPref" className="form-input" value={form.loanStatusPref} onChange={set('loanStatusPref')}>
                    <option value="">Select…</option>
                    {LOAN_STATUS_PREFS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mainObjective">Main Objective</label>
                <select id="mainObjective" className="form-input" value={form.mainObjective} onChange={set('mainObjective')}>
                  <option value="">Select…</option>
                  {MAIN_OBJECTIVES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="terms-check">
            <input type="checkbox" id="terms" checked={form.terms}
              onChange={(e) => { setForm((p) => ({ ...p, terms: e.target.checked })); setFieldErrors((p) => ({ ...p, terms: undefined })) }} />
            <label htmlFor="terms" style={{ cursor: 'pointer' }}>
              I agree to the{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
              I confirm I am an institutional or accredited investor.
            </label>
          </div>
          {fieldErrors.terms && (
            <div className="form-error" style={{ marginTop: '-12px', marginBottom: '16px' }}>{fieldErrors.terms}</div>
          )}

          <button type="submit" className="btn btn--gold btn--full btn--lg" disabled={loading}>
            {loading && <Spinner size={16} color="#0a0a0a" />}
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>

        <div className="form-divider">
          <span>Already have an account?</span>
        </div>
        <Link href="/signin" className="btn btn--ghost btn--full">Sign In</Link>
      </div>
    </div>
  )
}
