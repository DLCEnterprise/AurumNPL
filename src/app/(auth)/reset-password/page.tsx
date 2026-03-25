'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/Skeleton'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [tokenValid, setTokenValid] = useState<boolean | null>(null) // null = checking
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => setTokenValid(data.valid === true))
      .catch(() => setTokenValid(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    const failedRule = PASSWORD_RULES.find((r) => !r.test(password))
    if (failedRule) {
      setError(failedRule.label + ' is required.')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'An error occurred. Please try again.')
        return
      }

      router.push('/signin?reset=success')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon">◈</span>
          <span className="auth-card__logo-text">AURUM</span>
        </div>

        <h1>Set new password</h1>
        <p className="auth-card__subtitle">Choose a strong password for your account</p>

        {/* Checking token */}
        {tokenValid === null && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Spinner size={24} color="var(--gold-300)" />
          </div>
        )}

        {/* Invalid token */}
        {tokenValid === false && (
          <>
            <div className="alert alert--error" role="alert">
              This reset link is invalid or has expired. Please request a new one.
            </div>
            <div style={{ marginTop: '20px' }}>
              <Link href="/forgot-password" className="btn btn--gold btn--full">
                Request New Link
              </Link>
            </div>
          </>
        )}

        {/* Valid token — show form */}
        {tokenValid === true && (
          <>
            {error && (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm">Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Password requirements hint */}
              {password.length > 0 && (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {PASSWORD_RULES.map((rule) => (
                    <li
                      key={rule.label}
                      style={{
                        fontSize: '0.78rem',
                        color: rule.test(password) ? 'var(--gold-300)' : 'var(--text-muted)',
                      }}
                    >
                      {rule.test(password) ? '✓' : '○'} {rule.label}
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="submit"
                className="btn btn--gold btn--full btn--lg"
                disabled={loading}
              >
                {loading && <Spinner size={16} color="#0a0a0a" />}
                {loading ? 'Saving…' : 'Set New Password'}
              </button>
            </form>
          </>
        )}

        <div className="form-divider">
          <span>Remember your password?</span>
        </div>

        <Link href="/signin" className="btn btn--ghost btn--full">
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
