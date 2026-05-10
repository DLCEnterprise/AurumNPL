import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// ─── Required environment variable validation ────────────────────────────────
// Fail fast at boot rather than at runtime when a secret is missing.
const REQUIRED_ENV: string[] = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'ADMIN_SECRET',
  'RESET_SECRET',
  'RESEND_API_KEY',
  'ADMIN_EMAIL',
  'BASE_URL',
  // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN: add when Upstash is provisioned.
  // Without these, auth rate limits fall back to per-instance in-memory (ineffective at scale).
]

if (process.env.NODE_ENV !== 'test') {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables: ${missing.join(', ')}. ` +
      'Add them to your .env.local (dev) or Vercel environment settings (prod).'
    )
  }
}

const isDev = process.env.NODE_ENV === 'development'
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

// Derive the origin for CSP (strip path)
const origin = (() => {
  try {
    return new URL(BASE_URL).origin
  } catch {
    return 'http://localhost:3000'
  }
})()

/**
 * Content-Security-Policy
 * - Allows Google Fonts (fonts.googleapis.com, fonts.gstatic.com)
 * - Allows Next.js inline scripts in dev
 * - Blocks all else by default
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : "'unsafe-inline'"} https://maps.googleapis.com https://maps.gstatic.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.ggpht.com`,
  `connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://o*.ingest.sentry.io`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
]
  .join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      // ── Security headers on all routes ────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // ── CORS on API routes: same-origin only ──────────────────────────
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: origin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          // Vary so proxies don't cache across origins
          { key: 'Vary', value: 'Origin' },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [],
  },
}

export default withSentryConfig(nextConfig, {
  // Suppress output when SENTRY_AUTH_TOKEN is absent (no source map upload)
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Upload source maps only when SENTRY_AUTH_TOKEN is present
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
