// QA sweep — authenticate as a seeded admin against the deployed app,
// fetch every key surface, capture HTML to ./qa-output/, scan for issues.

import { writeFileSync, mkdirSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const BASE = process.env.QA_BASE || 'https://aurum-npl-lflx.vercel.app'
const ADMIN_EMAIL = 'edlcsonofdavid@gmail.com'

mkdirSync('qa-output', { recursive: true })

// ── Get admin's existing password hash and reuse one we know ──
// We don't know the admin's real password; instead, sign in as a seeded user.
const SEEDED_EMAIL = 'r.calloway@northchase-nh.com'  // SELLER role
const SEEDED_PASSWORD = 'Demo!2026Aurum'
const SEEDED_BUYER_EMAIL = 'j.weston@brightlinecap.com'

// ── Cookie management ──
let cookieStore = new Map()
function cookieHeader() {
  return [...cookieStore.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}
function ingestSetCookie(res) {
  const setCookies = res.headers.getSetCookie?.() || []
  for (const sc of setCookies) {
    const first = sc.split(';')[0]
    const eq = first.indexOf('=')
    if (eq > 0) cookieStore.set(first.slice(0, eq), first.slice(eq + 1))
  }
}
async function get(url) {
  const res = await fetch(url, {
    headers: cookieStore.size ? { cookie: cookieHeader() } : {},
    redirect: 'manual',
  })
  ingestSetCookie(res)
  return res
}
async function post(url, body, type = 'application/x-www-form-urlencoded') {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': type, ...(cookieStore.size ? { cookie: cookieHeader() } : {}) },
    body,
    redirect: 'manual',
  })
  ingestSetCookie(res)
  return res
}

async function signIn(email, password) {
  cookieStore.clear()
  const csrfRes = await get(`${BASE}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()
  const signinRes = await post(
    `${BASE}/api/auth/callback/credentials?json=true`,
    new URLSearchParams({ csrfToken, email, password, callbackUrl: '/dashboard' }),
  )
  const hasSession = [...cookieStore.keys()].some(k => k.includes('session-token'))
  return { status: signinRes.status, hasSession, cookies: [...cookieStore.keys()] }
}

const ROUTES = [
  // Authenticated
  { path: '/dashboard',          label: 'dashboard' },
  { path: '/listings',           label: 'listings-browse' },
  { path: '/listings?sortBy=upbDesc', label: 'listings-sort-upb-desc' },
  { path: '/listings?assetType=COMMERCIAL', label: 'listings-filter-commercial' },
  { path: '/listings?mine=true', label: 'listings-mine' },
  { path: '/listings/new',       label: 'listings-new' },
  { path: '/listings/import',    label: 'listings-import' },
  { path: '/messages',           label: 'messages' },
  { path: '/notifications',      label: 'notifications' },
  { path: '/pipeline',           label: 'pipeline' },
  { path: '/watchlist',          label: 'watchlist' },
  { path: '/deals',              label: 'deals' },
  { path: '/profile',            label: 'profile' },
  { path: '/admin',              label: 'admin-dashboard' },
  { path: '/admin/users',        label: 'admin-users' },
  { path: '/admin/listings',     label: 'admin-listings' },
  { path: '/admin/vendors',      label: 'admin-vendors' },
  { path: '/admin/mlpa',         label: 'admin-mlpa' },
  { path: '/tools/yield-calculator', label: 'yield-calculator' },
]

// ── Issue detectors (run on HTML) ──
const DETECTORS = [
  { id: 'error-overlay',    name: 'Next.js error overlay',         re: /__NEXT_DATA__[\s\S]*?"err"\s*:\s*\{/ },
  { id: 'application-error', name: 'Application error',            re: /Application error|Internal Server Error|TypeError:|ReferenceError:/i },
  { id: 'undefined-text',   name: '"undefined" rendered as text',  re: />undefined</ },
  { id: 'null-text',        name: '"null" rendered as text',       re: />null</ },
  { id: 'nan-text',         name: '"NaN" rendered as text',        re: />NaN</ },
  { id: 'lorem-ipsum',      name: 'Lorem ipsum placeholder',       re: /lorem ipsum/i },
  { id: 'todo-comment-rendered', name: 'TODO rendered to client',  re: />\s*TODO[:\s]/i },
  { id: 'fake-placeholder', name: 'Hard-coded "Coming soon"',      re: /coming soon/i },
  { id: 'href-empty',       name: 'href="#" dead link in rendered output', re: /href="#"/g },
  { id: 'fake-money',       name: 'Hard-coded $18.4M / $48.7M etc placeholder', re: /\$18\.4M|\$48\.7M|\$6\.1M|\$92\.3M/ },
]

const findings = []

console.log(`▸ QA sweep against ${BASE}\n`)

// Sign in as seeded SELLER
const signin = await signIn(SEEDED_EMAIL, SEEDED_PASSWORD)
console.log(`  signin (${SEEDED_EMAIL}): status=${signin.status} hasSession=${signin.hasSession}`)
console.log(`  cookies: ${signin.cookies.join(', ')}`)
if (!signin.hasSession) {
  console.log('  ✗ Could not authenticate. Stopping.')
  process.exit(1)
}

// Sanity: hit /api/auth/session to confirm we're actually signed in
const sessionRes = await get(`${BASE}/api/auth/session`)
const sessionTxt = await sessionRes.text()
console.log(`  /api/auth/session: status=${sessionRes.status}, body sample: ${sessionTxt.slice(0, 200)}`)

// Probe each route, capture HTML, run detectors
for (const route of ROUTES) {
  const url = `${BASE}${route.path}`
  const start = Date.now()
  const res = await get(url)
  const ms = Date.now() - start

  let bodyLen = 0
  let issues = []

  if (res.status >= 200 && res.status < 400) {
    const text = await res.text()
    bodyLen = text.length
    writeFileSync(`qa-output/${route.label}.html`, text)

    for (const d of DETECTORS) {
      const matches = text.match(d.re)
      if (matches) {
        const count = Array.isArray(matches) ? matches.length : 1
        issues.push({ id: d.id, name: d.name, count })
      }
    }
  } else if (res.status === 307 || res.status === 302) {
    issues.push({ id: 'redirected', name: `Redirected to ${res.headers.get('location')}`, count: 1 })
  }

  const issueStr = issues.length ? issues.map(i => `${i.id}(${i.count})`).join(' ') : '—'
  console.log(`  ${route.label.padEnd(30)} ${String(res.status).padEnd(4)} ${(ms+'ms').padStart(7)}  ${(bodyLen+'b').padStart(8)}  ${issueStr}`)

  if (issues.length) findings.push({ route: route.path, issues, status: res.status })
}

// ── Bonus: hit a specific listing detail for a seeded listing ──
console.log('\n▸ Listing detail probes:')
const p = new PrismaClient()
const seededListings = await p.listing.findMany({
  where: { listingNumber: { startsWith: 'AUR-2026-' } },
  select: { id: true, title: true, listingNumber: true, status: true, ndaRequired: true },
  take: 4,
})
for (const l of seededListings) {
  const url = `${BASE}/listings/${l.id}`
  const start = Date.now()
  const res = await get(url)
  const ms = Date.now() - start
  let issues = []
  if (res.status >= 200 && res.status < 400) {
    const text = await res.text()
    writeFileSync(`qa-output/listing-${l.listingNumber}.html`, text)
    for (const d of DETECTORS) {
      const matches = text.match(d.re)
      if (matches) issues.push({ id: d.id, count: Array.isArray(matches) ? matches.length : 1 })
    }
  }
  const issueStr = issues.length ? issues.map(i => `${i.id}(${i.count})`).join(' ') : '—'
  console.log(`  ${l.listingNumber.padEnd(15)} ${l.status.padEnd(15)} ${String(res.status).padEnd(4)} ${(ms+'ms').padStart(7)}  ${issueStr}`)
  if (issues.length) findings.push({ route: `/listings/${l.id}`, listing: l.listingNumber, issues, status: res.status })
}
await p.$disconnect()

// ── Summary ──
console.log(`\n▸ Findings summary: ${findings.length} routes with issues`)
writeFileSync('qa-output/findings.json', JSON.stringify(findings, null, 2))
console.log('  Wrote qa-output/findings.json')
console.log(`  Full HTML captures in qa-output/*.html`)
