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
  role: 'SELLER' | 'BUYER'
  terms: boolean
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

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {}

  if (!form.name.trim()) errors.name = 'Full name is required.'
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'A valid email address is required.'
  if (!PASSWORD_REGEX.test(form.password))
    errors.password =
      'Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.'
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = 'Passwords do not match.'
  if (!form.company.trim()) errors.company = 'Company name is required.'
  if (!form.terms) errors.terms = 'You must accept the Terms of Service to continue.'

  return errors
}

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    role: 'SELLER',
    terms: false,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    // Clear field error on change
    if (fieldErrors[key as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        company: form.company.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
      }),
    })

    setLoading(false)
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
          <div className="alert alert--error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role selector */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>I am a</label>
            <div className="role-toggle">
              <div className="role-option">
                <input
                  type="radio"
                  id="role-seller"
                  name="role"
                  value="SELLER"
                  checked={form.role === 'SELLER'}
                  onChange={() => setForm((p) => ({ ...p, role: 'SELLER' }))}
                />
                <label htmlFor="role-seller">
                  Seller
                  <span>List NPL portfolios</span>
                </label>
              </div>
              <div className="role-option">
                <input
                  type="radio"
                  id="role-buyer"
                  name="role"
                  value="BUYER"
                  checked={form.role === 'BUYER'}
                  onChange={() => setForm((p) => ({ ...p, role: 'BUYER' }))}
                />
                <label htmlFor="role-buyer">
                  Buyer
                  <span>Acquire distressed debt</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                className={`form-input${fieldErrors.name ? ' form-input--error' : ''}`}
                placeholder="Jane Smith"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
              />
              {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="company">Company *</label>
              <input
                id="company"
                type="text"
                className={`form-input${fieldErrors.company ? ' form-input--error' : ''}`}
                placeholder="Acme Capital"
                value={form.company}
                onChange={set('company')}
                autoComplete="organization"
              />
              {fieldErrors.company && <span className="form-error">{fieldErrors.company}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Work Email *</label>
            <input
              id="email"
              type="email"
              className={`form-input${fieldErrors.email ? ' form-input--error' : ''}`}
              placeholder="jane@acmecapital.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
            {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              className="form-input"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              type="password"
              className={`form-input${fieldErrors.password ? ' form-input--error' : ''}`}
              placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
            />
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              className={`form-input${fieldErrors.confirmPassword ? ' form-input--error' : ''}`}
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <span className="form-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <div className="terms-check">
            <input
              type="checkbox"
              id="terms"
              checked={form.terms}
              onChange={set('terms')}
            />
            <label htmlFor="terms" style={{ cursor: 'pointer' }}>
              I agree to the{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
              I confirm I am an institutional or accredited investor.
            </label>
          </div>
          {fieldErrors.terms && (
            <div className="form-error" style={{ marginTop: '-12px', marginBottom: '16px' }}>
              {fieldErrors.terms}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--gold btn--full btn--lg"
            disabled={loading}
          >
            {loading && <Spinner size={16} color="#0a0a0a" />}
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>

        <div className="form-divider">
          <span>Already have an account?</span>
        </div>

        <Link href="/signin" className="btn btn--ghost btn--full">
          Sign In
        </Link>
      </div>
    </div>
  )
}
