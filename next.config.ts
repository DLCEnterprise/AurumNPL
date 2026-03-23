import type { NextConfig } from 'next'

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
  `script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : "'unsafe-inline'"}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: blob:`,
  `connect-src 'self'`,
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

export default nextConfig
