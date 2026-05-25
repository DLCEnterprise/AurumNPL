// Sign in as the seeded demo seller, then HTTP-probe every authenticated route.
// Manual cookie management (no tough-cookie dep).

const BASE = 'http://localhost:3000'
// Demo accounts (created by seed-demo.mjs):
const EMAIL = 'r.calloway@northchase-nh.com'  // SELLER role, multiple listings + bids received
const PASSWORD = 'Demo!2026Aurum'

let cookieStore = new Map()  // name -> value

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

const csrfRes = await get(`${BASE}/api/auth/csrf`)
const { csrfToken } = await csrfRes.json()
console.log(`csrf: ${csrfToken.slice(0, 16)}…`)

const signinRes = await post(
  `${BASE}/api/auth/callback/credentials?json=true`,
  new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, callbackUrl: '/dashboard' }),
)
console.log(`signin POST: ${signinRes.status}, cookies after: ${[...cookieStore.keys()].join(', ')}`)

const hasSession = [...cookieStore.keys()].some(k => k.includes('session-token'))
if (!hasSession) {
  const body = await signinRes.text()
  console.log('✗ No session cookie. Response body sample:', body.slice(0, 300))
  process.exit(1)
}
console.log('✓ Signed in.\n')

const routes = [
  '/dashboard', '/listings', '/listings/new', '/listings/import',
  '/messages', '/notifications', '/pipeline', '/watchlist', '/deals', '/profile',
  '/admin', '/admin/users', '/admin/listings', '/admin/vendors', '/admin/mlpa',
  '/tools/yield-calculator',
]

console.log('route                          status   time      note')
for (const route of routes) {
  const start = Date.now()
  const res = await get(`${BASE}${route}`)
  const ms = Date.now() - start
  let note = ''
  if (res.status >= 200 && res.status < 400) {
    const txt = await res.text()
    if (/Application error|TypeError|ReferenceError|Internal Server Error/i.test(txt)) {
      note = '⚠️ ERROR MARKERS'
    } else {
      note = `${txt.length}b`
    }
  } else if (res.status === 307 || res.status === 302) {
    note = `→ ${res.headers.get('location') ?? ''}`
  }
  console.log(`${route.padEnd(30)} ${String(res.status).padEnd(8)} ${(ms + 'ms').padStart(8)}  ${note}`)
}
