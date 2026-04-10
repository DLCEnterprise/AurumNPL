'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Spinner } from '@/components/ui/Skeleton'

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard'
  const errorParam = params.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const resetParam = params.get('reset')

  const [error, setError] = useState<string | null>(
    errorParam === 'rejected'
      ? 'Your application was not approved. Contact support@aurum.finance for details.'
      : errorParam === 'suspended'
      ? 'Your account has been suspended. Contact support@aurum.finance for assistance.'
      : null
  )
  const success = resetParam === 'success'
    ? 'Your password has been reset. You can now sign in with your new password.'
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Check for rate limiting before handing off to NextAuth
    const rateCheck = await fetch('/api/auth/rate-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }).catch(() => null)

    if (rateCheck?.status === 429) {
      const retryAfter = rateCheck.headers.get('Retry-After')
      const mins = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 15
      setError(`Too many sign-in attempts. Please try again in ${mins} minute${mins !== 1 ? 's' : ''}.`)
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (!result || result.error) {
      // Check if this is a pending account (credentials provider returns false → callbackUrl has error)
      if (result?.error === 'CredentialsSignin') {
        // Try to give a more specific message by checking status via the signup check endpoint
        const res = await fetch('/api/auth/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.approvalStatus === 'PENDING') {
            setError('Your account is still pending approval. You will receive an email once approved.')
            return
          }
          if (data.approvalStatus === 'REJECTED') {
            setError('Your application was not approved. Contact support@aurum.finance for details.')
            return
          }
        }
        setError('Incorrect email or password. Please try again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon">◈</span>
          <span className="auth-card__logo-text">AURUM</span>
        </div>

        <h1>Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to your institutional account</p>

        {success && (
          <div className="alert alert--success" role="alert">
            {success}
          </div>
        )}

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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--gold-300)' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn--gold btn--full btn--lg"
            disabled={loading}
          >
            {loading && <Spinner size={16} color="#0a0a0a" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="form-divider">
          <span>New to AURUM?</span>
        </div>

        <Link href="/signup" className="btn btn--ghost btn--full">
          Request Access
        </Link>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
