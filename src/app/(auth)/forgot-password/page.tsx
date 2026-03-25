'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Skeleton'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'An error occurred. Please try again.')
        return
      }

      setSubmitted(true)
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

        <h1>Reset your password</h1>
        <p className="auth-card__subtitle">
          Enter your email and we&apos;ll send you a reset link
        </p>

        {submitted ? (
          <div className="alert alert--success" role="alert">
            If that email is registered, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <>
            {error && (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn btn--gold btn--full btn--lg"
                disabled={loading}
              >
                {loading && <Spinner size={16} color="#0a0a0a" />}
                {loading ? 'Sending…' : 'Send Reset Link'}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
