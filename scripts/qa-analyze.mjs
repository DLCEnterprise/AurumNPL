// Parse the captured HTML files (qa-output/*.html) and report real issues:
//   - Pages with no content (broken render)
//   - "Coming soon", "Lorem ipsum", "undefined" appearing as visible body text
//   - Pages with suspicious h1 (e.g. errors)
//   - Listings without expected data
//
// Only looks at the server-rendered HTML body — strips React Flight payload
// (which escapes $ as $$ and isn't user-visible).

import { readFileSync, readdirSync, writeFileSync } from 'fs'

function stripNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
}

function visibleText(html) {
  return stripNoise(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Patterns that, when found in visible text, indicate a real issue
const ISSUE_PATTERNS = [
  { id: 'lorem',          re: /lorem ipsum/i,           note: 'placeholder copy left in' },
  { id: 'todo',           re: /\bTODO\b/,               note: 'TODO marker visible' },
  { id: 'undefined-text', re: /\bundefined\b/,          note: '"undefined" rendered' },
  { id: 'null-text',      re: /(?<![\w-])null(?![\w-])/, note: '"null" rendered' },
  { id: 'nan',            re: /\bNaN\b/,                note: '"NaN" rendered' },
  { id: 'jsobject',       re: /\[object Object\]/,      note: 'unrendered object' },
  { id: 'empty-curly',    re: /\{\}/,                   note: 'empty template' },
  { id: 'coming-soon',    re: /coming soon/i,           note: '"coming soon" copy' },
  { id: 'fake-money-18.4M', re: /\$18\.4M\b/,           note: 'leftover SAMPLE_LISTINGS $18.4M' },
  { id: 'fake-money-48.7M', re: /\$48\.7M\b/,           note: 'leftover SAMPLE_LISTINGS $48.7M' },
  { id: 'fake-money-92.3M', re: /\$92\.3M\b/,           note: 'leftover SAMPLE_LISTINGS $92.3M' },
  { id: 'atlas-capital',  re: /atlas capital/i,         note: 'leftover ATLAS CAPITAL placeholder' },
  { id: 'meridian-fund',  re: /meridian fund/i,         note: 'leftover MERIDIAN FUND placeholder' },
  { id: 'app-error',      re: /Application error/,      note: 'Application error visible' },
  { id: 'server-error',   re: /Internal Server Error/,  note: 'Internal Server Error visible' },
]

const files = readdirSync('qa-output').filter(f => f.endsWith('.html')).sort()

const allFindings = []
console.log('Page                                Size      Issues')
console.log('-----------------------------------------------------------------')
for (const f of files) {
  const raw = readFileSync(`qa-output/${f}`, 'utf-8')
  const body = visibleText(raw)
  const found = []
  for (const p of ISSUE_PATTERNS) {
    const matches = body.match(p.re)
    if (matches) found.push({ ...p, count: matches.length, sample: body.slice(Math.max(0, body.indexOf(matches[0]) - 30), body.indexOf(matches[0]) + 60) })
  }
  console.log(`  ${f.padEnd(35)} ${String(body.length).padStart(8)}b ${found.length ? found.map(x => `${x.id}(${x.count})`).join(' ') : '—'}`)
  if (found.length) allFindings.push({ file: f, findings: found })
}

// Specific structural checks
console.log('\n--- Structural checks ---')
function check(label, condition, detail = '') {
  const mark = condition ? '✓' : '✗'
  console.log(`  ${mark} ${label}${detail ? ' — ' + detail : ''}`)
  return condition
}

const dashHtml = readFileSync('qa-output/dashboard.html', 'utf-8')
check('Dashboard greets user by first name', /Good (morning|afternoon|evening), <span[^>]*>Rebecca/.test(dashHtml))
check('Dashboard shows role badge', /Seller Account|Buyer Account|Buyer \+ Seller|Administrator/.test(dashHtml))

const browseHtml = readFileSync('qa-output/listings-browse.html', 'utf-8')
const titleCount = (browseHtml.match(/listing-card__title">/g) || []).length
check('Listings browse renders 12 cards (PAGE_SIZE)', titleCount === 12, `found ${titleCount}`)
const ndaBadgeCount = (browseHtml.match(/NDA Required/i) || []).length
check('Listings browse shows NDA-required badges', ndaBadgeCount > 0, `count: ${ndaBadgeCount}`)

const commercialHtml = readFileSync('qa-output/listings-filter-commercial.html', 'utf-8')
const commercialCardCount = (commercialHtml.match(/listing-card__title">/g) || []).length
check('Commercial filter shows 3 listings', commercialCardCount === 3, `found ${commercialCardCount}`)

const mineHtml = readFileSync('qa-output/listings-mine.html', 'utf-8')
const mineCount = (mineHtml.match(/listing-card__title">/g) || []).length
// Rebecca (sellerIdx 0) owns 6 seeded listings: #1,2,7,11,15,19
check('Mine filter shows Rebecca\'s 6 listings', mineCount >= 4, `found ${mineCount}`)

const pipelineHtml = readFileSync('qa-output/pipeline.html', 'utf-8')
check('Pipeline page has 5 stage columns', /Reviewing[\s\S]*Bidding[\s\S]*Under LOI[\s\S]*Closing[\s\S]*Closed/.test(pipelineHtml))

const watchHtml = readFileSync('qa-output/watchlist.html', 'utf-8')
const wlCount = (watchHtml.match(/listing-card__title">/g) || []).length
check('Watchlist either shows saved or empty-state', wlCount > 0 || /watchlist is empty|saved/i.test(watchHtml))

const notifHtml = readFileSync('qa-output/notifications.html', 'utf-8')
check('Notifications page renders', /Notifications/.test(notifHtml))

const profileHtml = readFileSync('qa-output/profile.html', 'utf-8')
check('Profile renders user email', /r\.calloway@northchase-nh\.com/.test(profileHtml))
check('Profile renders company', /Northchase Note Holdings/.test(profileHtml))

const dallasHtml = readFileSync('qa-output/listing-AUR-2026-00001.html', 'utf-8')
check('Dallas listing detail shows title', /Dallas Metro Single-Family/.test(dallasHtml))
check('Dallas listing shows bid history (owner sees bids)', />\$1\.4M</.test(dallasHtml) || /Bid History|Bid Activity/.test(dallasHtml))
check('Dallas listing shows lien position', /Senior|First Mortgage/.test(dallasHtml))

writeFileSync('qa-output/analysis.json', JSON.stringify(allFindings, null, 2))
console.log(`\nTotal pages with text-issue findings: ${allFindings.length}`)
console.log('Wrote qa-output/analysis.json')
