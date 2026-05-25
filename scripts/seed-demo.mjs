// ─────────────────────────────────────────────────────────────────────────────
//  AURUM Demo Seed
//  ───────────────
//  Populates the dev/staging DB (shared with deployment) with realistic
//  institutional fixtures so the marketplace looks lived-in for client demos.
//
//  Idempotent: re-running upserts users by email, listings by listingNumber,
//  bids/NDAs/pipeline by composite keys. Never modifies existing rows that
//  weren't created by this script.
//
//  All seeded users carry `adminNotes: 'seed:demo-may-2026'` so they can be
//  identified and removed later via a cleanup query.
//
//  Run:  node --env-file=.env scripts/seed-demo.mjs
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const SEED_TAG = 'seed:demo-may-2026'

// ── Helpers ─────────────────────────────────────────────────────────────────
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Deterministic ListingNumber generator so re-runs hit the same row.
const ln = (n) => `AUR-2026-${String(n).padStart(5, '0')}`

// ── Demo users ──────────────────────────────────────────────────────────────
// Institutional-sounding but obviously not real. Domains are invented.
const DEMO_USERS = [
  // Sellers (institutional)
  { email: 'r.calloway@northchase-nh.com',     name: 'Rebecca Calloway',  company: 'Northchase Note Holdings',  role: 'SELLER',       investorType: 'Fund Manager',    lienPosition: 'First Mortgage',     loanStatusPref: 'Non-Performing' },
  { email: 'm.diaz@cascadeloan.com',           name: 'Marcus Diaz',       company: 'Cascade Loan Resolution',   role: 'SELLER',       investorType: 'Partner',         lienPosition: 'Both',               loanStatusPref: 'Non-Performing' },
  { email: 't.nakamura@vellumassets.com',      name: 'Toshi Nakamura',    company: 'Vellum Asset Partners',     role: 'SELLER',       investorType: 'Fund Manager',    lienPosition: 'First Mortgage',     loanStatusPref: 'Both' },

  // Buyers (institutional)
  { email: 'j.weston@brightlinecap.com',       name: 'Julia Weston',      company: 'Brightline Distressed Capital', role: 'BUYER',   investorType: 'Fund Manager',    lienPosition: 'First Mortgage',     loanStatusPref: 'Non-Performing', mainObjective: 'Cash Flow' },
  { email: 'p.okafor@pinegrove-npl.com',       name: 'Patrick Okafor',    company: 'Pinegrove NPL Group',       role: 'BUYER',        investorType: 'Private Investor', lienPosition: 'Both',              loanStatusPref: 'Non-Performing', mainObjective: 'Quick Payoff/Short Pay' },
  { email: 's.harlan@stonewardcm.com',         name: 'Sarah Harlan',      company: 'Stoneward Capital Markets', role: 'BUYER',        investorType: 'Fund Manager',    lienPosition: 'First Mortgage',     loanStatusPref: 'Non-Performing', mainObjective: 'Obtain Real Estate' },

  // Dual-role
  { email: 'a.brennan@riverviewcs.com',        name: 'Adam Brennan',      company: 'Riverview Credit Strategies', role: 'SELLER_BUYER', investorType: 'Partner',       lienPosition: 'Both',               loanStatusPref: 'Both',           mainObjective: 'Cash Flow' },
]

// ── Listings ────────────────────────────────────────────────────────────────
// Realistic mix: residential dominates (per NPL market), some commercial &
// consumer; lien position weighted to SENIOR; geo spread across major states.
const DEMO_LISTINGS = [
  // ── Residential SENIOR ─────────────────────────────────────────────────
  { n: 1,  sellerIdx: 0, title: 'Dallas Metro Single-Family NPL Pool (12 Notes)',     assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 12, unpaidBalance: 2_350_000, askingPrice: 1_540_000, location: 'Dallas, TX',      state: 'TX', zip: '75201', avgDelinquency: 318, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 2,  sellerIdx: 0, title: 'Atlanta SFR Senior-Lien Tape — 8 Loans',             assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 8,  unpaidBalance: 1_780_000, askingPrice: 1_140_000, location: 'Atlanta, GA',     state: 'GA', zip: '30303', avgDelinquency: 247, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 3,  sellerIdx: 1, title: 'Phoenix Valley Residential Note (Single Asset)',     assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 1,  unpaidBalance: 412_000,   askingPrice: 268_000,   location: 'Phoenix, AZ',     state: 'AZ', zip: '85003', avgDelinquency: 174, performanceStatus: 'Sub-Performing', ndaRequired: false, status: 'ACTIVE' },
  { n: 4,  sellerIdx: 1, title: 'Jacksonville FL — 5 NPL Senior Liens',               assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 5,  unpaidBalance: 945_000,   askingPrice: 620_000,   location: 'Jacksonville, FL', state: 'FL', zip: '32202', avgDelinquency: 412, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 5,  sellerIdx: 2, title: 'Cleveland OH Re-Performing Pool — 20 Notes',         assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 20, unpaidBalance: 1_220_000, askingPrice: 880_000,   location: 'Cleveland, OH',   state: 'OH', zip: '44113', avgDelinquency: 96,  performanceStatus: 'Re-Performing',  ndaRequired: true,  status: 'ACTIVE' },
  { n: 6,  sellerIdx: 2, title: 'Detroit MI Tape — Mixed Status Single-Family',       assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 15, unpaidBalance: 1_055_000, askingPrice: 615_000,   location: 'Detroit, MI',     state: 'MI', zip: '48201', avgDelinquency: 285, performanceStatus: 'Non-Performing', ndaRequired: false, status: 'ACTIVE' },
  { n: 7,  sellerIdx: 0, title: 'Charlotte Metro Residential Note',                   assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 1,  unpaidBalance: 365_000,   askingPrice: 245_000,   location: 'Charlotte, NC',   state: 'NC', zip: '28202', avgDelinquency: 218, performanceStatus: 'Non-Performing', ndaRequired: false, status: 'ACTIVE' },
  { n: 8,  sellerIdx: 6, title: 'Tampa Bay 4-Loan Senior Bundle',                     assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 4,  unpaidBalance: 845_000,   askingPrice: 595_000,   location: 'Tampa, FL',       state: 'FL', zip: '33602', avgDelinquency: 142, performanceStatus: 'Sub-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 9,  sellerIdx: 1, title: 'Memphis TN Residential NPL — 7 Notes',               assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 7,  unpaidBalance: 638_000,   askingPrice: 410_000,   location: 'Memphis, TN',     state: 'TN', zip: '38103', avgDelinquency: 365, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 10, sellerIdx: 2, title: 'Las Vegas NV Single-Asset Senior Lien',              assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 1,  unpaidBalance: 528_000,   askingPrice: 340_000,   location: 'Las Vegas, NV',   state: 'NV', zip: '89101', avgDelinquency: 198, performanceStatus: 'Non-Performing', ndaRequired: false, status: 'ACTIVE' },

  // ── Residential JUNIOR / HELOC ────────────────────────────────────────
  { n: 11, sellerIdx: 0, title: 'Multi-State Junior Lien Bundle — 18 HELOCs',         assetType: 'RESIDENTIAL', lienPosition: 'JUNIOR', loanCount: 18, unpaidBalance: 612_000,   askingPrice: 188_000,   location: 'Various',         state: 'CA', zip: '90001', avgDelinquency: 285, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 12, sellerIdx: 1, title: 'California 2nd-Lien Pool — 6 Loans',                 assetType: 'RESIDENTIAL', lienPosition: 'JUNIOR', loanCount: 6,  unpaidBalance: 295_000,   askingPrice: 92_000,    location: 'Los Angeles, CA', state: 'CA', zip: '90015', avgDelinquency: 222, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 13, sellerIdx: 2, title: 'Texas Junior Lien NPL — 9 Notes',                    assetType: 'RESIDENTIAL', lienPosition: 'JUNIOR', loanCount: 9,  unpaidBalance: 388_000,   askingPrice: 118_000,   location: 'Houston, TX',     state: 'TX', zip: '77002', avgDelinquency: 410, performanceStatus: 'Non-Performing', ndaRequired: false, status: 'ACTIVE' },
  { n: 14, sellerIdx: 6, title: 'New Jersey HELOC NPL Single Asset',                  assetType: 'RESIDENTIAL', lienPosition: 'JUNIOR', loanCount: 1,  unpaidBalance: 145_000,   askingPrice: 38_000,    location: 'Newark, NJ',      state: 'NJ', zip: '07102', avgDelinquency: 540, performanceStatus: 'Non-Performing', ndaRequired: false, status: 'ACTIVE' },

  // ── Commercial ────────────────────────────────────────────────────────
  { n: 15, sellerIdx: 0, title: 'Midwest Small-Balance Commercial NPL — Mixed Use',   assetType: 'COMMERCIAL',  lienPosition: 'SENIOR', loanCount: 3,  unpaidBalance: 4_250_000, askingPrice: 2_650_000, location: 'Chicago, IL',     state: 'IL', zip: '60601', avgDelinquency: 215, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 16, sellerIdx: 2, title: 'Houston Retail Strip Center Note',                   assetType: 'COMMERCIAL',  lienPosition: 'SENIOR', loanCount: 1,  unpaidBalance: 1_840_000, askingPrice: 1_150_000, location: 'Houston, TX',     state: 'TX', zip: '77019', avgDelinquency: 168, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },
  { n: 17, sellerIdx: 1, title: 'Northeast Office Park NPL',                          assetType: 'COMMERCIAL',  lienPosition: 'SENIOR', loanCount: 1,  unpaidBalance: 6_750_000, askingPrice: 3_800_000, location: 'Philadelphia, PA', state: 'PA', zip: '19103', avgDelinquency: 310, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },

  // ── Consumer ──────────────────────────────────────────────────────────
  { n: 18, sellerIdx: 6, title: 'Unsecured Consumer Charge-Off Tape — Series 26-A',   assetType: 'CONSUMER',    lienPosition: null,     loanCount: 1842, unpaidBalance: 8_950_000, askingPrice: 295_000,   location: 'Nationwide',      state: null,  zip: null,    avgDelinquency: 720, performanceStatus: 'Charged-Off',    ndaRequired: true,  status: 'ACTIVE' },
  { n: 19, sellerIdx: 0, title: 'Auto Deficiency NPL Pool — 124 Accounts',            assetType: 'CONSUMER',    lienPosition: null,     loanCount: 124,  unpaidBalance: 1_120_000, askingPrice: 84_000,    location: 'Nationwide',      state: null,  zip: null,    avgDelinquency: 545, performanceStatus: 'Charged-Off',    ndaRequired: false, status: 'ACTIVE' },

  // ── Mixed / Large institutional ───────────────────────────────────────
  { n: 20, sellerIdx: 1, title: 'Q2 2026 Mixed-Asset Strategic Disposition (42 Loans)', assetType: 'MIXED',    lienPosition: 'SENIOR', loanCount: 42, unpaidBalance: 12_400_000, askingPrice: 7_800_000, location: 'Multi-State',     state: 'CA', zip: '90001', avgDelinquency: 245, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'ACTIVE' },

  // ── A couple closing / sold to make pipeline real ─────────────────────
  { n: 21, sellerIdx: 2, title: 'Orlando FL Residential Note — UNDER LOI',            assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 1,  unpaidBalance: 285_000,   askingPrice: 185_000,   location: 'Orlando, FL',     state: 'FL', zip: '32801', avgDelinquency: 162, performanceStatus: 'Non-Performing', ndaRequired: true,  status: 'DUE_DILIGENCE' },
  { n: 22, sellerIdx: 0, title: 'Bakersfield CA Single SFR — CLOSED Mar 2026',        assetType: 'RESIDENTIAL', lienPosition: 'SENIOR', loanCount: 1,  unpaidBalance: 198_000,   askingPrice: 132_000,   location: 'Bakersfield, CA', state: 'CA', zip: '93301', avgDelinquency: 220, performanceStatus: 'Non-Performing', ndaRequired: false, status: 'SOLD' },
]

// ── Bids per listing — multi-bid history on a subset ────────────────────────
// Indices reference DEMO_LISTINGS array (0-based).
const DEMO_BIDS = [
  // Listing #1 — competitive
  { listingN: 1, buyerIdx: 3, amount: 1_410_000, status: 'COUNTERED', counterAmount: 1_490_000, daysAgo: 6, message: 'Tape reviewed; CLTV looks acceptable. Open to counter at $1.49M with 14-day DD.' },
  { listingN: 1, buyerIdx: 4, amount: 1_385_000, status: 'PENDING',   daysAgo: 3, message: 'Strong interest pending tape audit; can close in 21 days cash.' },
  { listingN: 1, buyerIdx: 5, amount: 1_350_000, status: 'PENDING',   daysAgo: 1, message: 'Initial indication of interest, subject to BPO confirmation.' },

  // Listing #2 — single accepted bid
  { listingN: 2, buyerIdx: 4, amount: 1_095_000, status: 'ACCEPTED',  daysAgo: 11, message: 'Accepting at $1.095M; will fund via Stoneward facility.' },

  // Listing #4 — counter exchange
  { listingN: 4, buyerIdx: 3, amount: 560_000, status: 'COUNTERED',   counterAmount: 595_000, daysAgo: 4, message: 'Concentration risk in 32202 ZIP; reflecting that.' },

  // Listing #5 — 2 pending
  { listingN: 5, buyerIdx: 5, amount: 820_000, status: 'PENDING', daysAgo: 8, message: 'Re-performing premium feels light; offering $820K.' },
  { listingN: 5, buyerIdx: 4, amount: 855_000, status: 'PENDING', daysAgo: 2, message: 'Slightly above competing IOI — clean cash close.' },

  // Listing #15 — commercial, one strong bid
  { listingN: 15, buyerIdx: 5, amount: 2_510_000, status: 'PENDING', daysAgo: 9, message: 'Reviewing rent rolls; offer subject to top-3 tenant verification.' },

  // Listing #20 — large mixed
  { listingN: 20, buyerIdx: 3, amount: 7_200_000, status: 'COUNTERED', counterAmount: 7_550_000, daysAgo: 14, message: 'Reflecting collateral diversity discount.' },

  // Listing #21 — accepted, UNDER_LOI
  { listingN: 21, buyerIdx: 4, amount: 178_000, status: 'ACCEPTED', daysAgo: 16, message: 'Accepting at $178K with 30-day close.' },

  // Listing #22 — sold
  { listingN: 22, buyerIdx: 3, amount: 128_000, status: 'ACCEPTED', daysAgo: 80, message: 'Closed and funded March 2026.' },
]

// ── NDAs signed (buyers gaining vault access on NDA-required listings) ─────
const DEMO_NDAS = [
  { listingN: 1, buyerIdx: 3 }, { listingN: 1, buyerIdx: 4 }, { listingN: 1, buyerIdx: 5 },
  { listingN: 2, buyerIdx: 4 },
  { listingN: 4, buyerIdx: 3 },
  { listingN: 15, buyerIdx: 5 },
  { listingN: 20, buyerIdx: 3 },
  { listingN: 21, buyerIdx: 4 },
]

// ── Saved listings (watchlist) for demo accounts ───────────────────────────
const DEMO_SAVED = [
  // For eddy@dlcep.com — assume he's also browsing as buyer-side
  { userEmail: 'eddy@dlcep.com', listingN: 5 },
  { userEmail: 'eddy@dlcep.com', listingN: 15 },
  { userEmail: 'eddy@dlcep.com', listingN: 20 },
]

// ── Pipeline entries for eddy@dlcep.com ────────────────────────────────────
const DEMO_PIPELINE = [
  { userEmail: 'eddy@dlcep.com', listingN: 5,  stage: 'REVIEWING', notes: 'Re-performing pool — modeling cash flow at 6% discount rate.' },
  { userEmail: 'eddy@dlcep.com', listingN: 15, stage: 'BIDDING',   notes: 'Submitted IOI; awaiting seller response. Strong if rent rolls verify.' },
  { userEmail: 'eddy@dlcep.com', listingN: 21, stage: 'UNDER_LOI', notes: 'LOI signed; BPO ordered, OE in progress.' },
]

// ── Vendor directory ───────────────────────────────────────────────────────
const DEMO_VENDORS = [
  { name: 'Apex Valuation Services',     category: 'BPO',      description: 'Nationwide residential BPO turnaround 3–5 business days.', contactName: 'Lisa Mendez',     contactEmail: 'orders@apexvaluation.com',   contactPhone: '(214) 555-0188', website: 'https://apexvaluation.example.com', sortOrder: 10 },
  { name: 'Continental Title & OE',      category: 'Title_OE', description: 'Full-service title search and ownership encumbrance reports, 48-state coverage.', contactName: 'Robert Kim', contactEmail: 'oe@continentaltitle.com', contactPhone: '(312) 555-0199', website: 'https://continentaltitle.example.com', sortOrder: 20 },
  { name: 'Hennessy & Burke LLP',        category: 'Legal',    description: 'Note-acquisition counsel, MLPA review, multi-state foreclosure expertise.', contactName: 'Daniel Hennessy', contactEmail: 'closings@hennessyburke.com', contactPhone: '(646) 555-0144', website: 'https://hennessyburke.example.com', sortOrder: 30 },
  { name: 'Greystone Document Custody',  category: 'Other',    description: 'Collateral file imaging, indexing, and custody for NPL portfolios.', contactName: 'Amanda Park', contactEmail: 'intake@greystonecustody.com', contactPhone: '(704) 555-0166', website: 'https://greystonecustody.example.com', sortOrder: 40 },
]

// ── MLPA template ──────────────────────────────────────────────────────────
const DEMO_MLPA = {
  version: 'v1.0',
  body: `MORTGAGE LOAN PURCHASE AGREEMENT

This Mortgage Loan Purchase Agreement ("Agreement") is entered into as of {{CLOSING_DATE}} between:

SELLER: {{SELLER_NAME}}, {{SELLER_ENTITY}}
BUYER:  {{BUYER_NAME}}, {{BUYER_ENTITY}}

1. ASSET TRANSFERRED
Seller agrees to sell, and Buyer agrees to purchase, the following mortgage loan asset(s):

  Listing Number:  {{LISTING_NUMBER}}
  Listing Title:   {{LISTING_TITLE}}
  Unpaid Balance:  {{UPB}}
  Asset Location:  {{LOCATION}}

2. PURCHASE PRICE
The total purchase price shall be {{PURCHASE_PRICE}}, payable via wire transfer to Seller's designated account within {{CLOSING_DAYS}} business days of execution.

3. REPRESENTATIONS & WARRANTIES
Seller represents that, to the best of its knowledge: (a) it holds clear title to the asset(s); (b) all documentation provided is true and accurate; (c) no undisclosed liens or encumbrances exist beyond those disclosed in the collateral file.

4. AS-IS DELIVERY
The asset(s) are sold AS-IS, WHERE-IS, with all faults. Buyer acknowledges completion of independent due diligence and waives any right of recourse for matters discoverable through standard NPL due diligence procedures.

5. GOVERNING LAW
This Agreement is governed by the laws of the state of {{GOVERNING_STATE}}.

EXECUTED:

___________________________          ___________________________
{{SELLER_NAME}}                       {{BUYER_NAME}}
Date: {{CLOSING_DATE}}                Date: {{CLOSING_DATE}}
`,
  notes: 'Standard institutional MLPA — covers single-asset and small-pool transactions. Custom riders attached for portfolio sales > 10 loans.',
  isActive: true,
}

// ── Notifications for demo accounts ────────────────────────────────────────
const DEMO_NOTIFICATIONS = [
  { userEmail: 'eddy@dlcep.com', type: 'NEW_BID',       title: 'New bid received',           body: 'Brightline Distressed Capital placed $1.41M on Dallas Metro Single-Family NPL Pool.',     unreadDaysAgo: 0.25 },
  { userEmail: 'eddy@dlcep.com', type: 'COUNTER_OFFER', title: 'Counter offer received',     body: 'Northchase Note Holdings countered your bid on Q2 2026 Mixed-Asset at $7.55M.',         unreadDaysAgo: 1 },
  { userEmail: 'eddy@dlcep.com', type: 'NEW_MESSAGE',   title: 'New message',                body: 'Julia Weston: "Reviewing the tape now, will respond within 24h."',                       unreadDaysAgo: 0.1 },
  { userEmail: 'eddy@dlcep.com', type: 'LISTING_SAVED', title: 'Saved listing updated',      body: 'New bid history on Midwest Small-Balance Commercial NPL.',                                unreadDaysAgo: 2 },
]

// ═══════════════════════════════════════════════════════════════════════════
//  Run
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('▸ Seeding demo data (tag:', SEED_TAG, ')\n')

  // 1) Users ─────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('Demo!2026Aurum', 10)
  const userMap = {}
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { adminNotes: SEED_TAG, approvalStatus: 'APPROVED' },
      create: {
        email: u.email,
        name: u.name,
        company: u.company,
        passwordHash: password,
        role: u.role,
        approvalStatus: 'APPROVED',
        approvedAt: daysAgo(60),
        investorType: u.investorType,
        lienPosition: u.lienPosition,
        loanStatusPref: u.loanStatusPref,
        mainObjective: u.mainObjective,
        adminNotes: SEED_TAG,
      },
    })
    userMap[u.email] = user.id
  }
  console.log(`  ✓ Users: ${Object.keys(userMap).length} upserted`)

  const userIdxToId = DEMO_USERS.map(u => userMap[u.email])

  // Look up existing user IDs for notifications/saved/pipeline
  const eddyUser = await prisma.user.findUnique({ where: { email: 'eddy@dlcep.com' } })
  const adminUser = await prisma.user.findUnique({ where: { email: 'edlcsonofdavid@gmail.com' } })

  // 2) Listings ──────────────────────────────────────────────────────────
  const listingMap = {}  // n -> id
  for (const l of DEMO_LISTINGS) {
    const sellerId = userIdxToId[l.sellerIdx]
    const listing = await prisma.listing.upsert({
      where: { listingNumber: ln(l.n) },
      update: {},  // do not overwrite — keep deterministic
      create: {
        listingNumber: ln(l.n),
        title: l.title,
        description: `Institutional-grade NPL ${l.assetType.toLowerCase()} offering. Tape, collateral file, and BPO summaries available upon NDA execution. All loans serviced by licensed third-party servicer.`,
        assetType: l.assetType,
        lienPosition: l.lienPosition,
        loanCount: l.loanCount,
        unpaidBalance: l.unpaidBalance,
        askingPrice: l.askingPrice,
        location: l.location,
        region: l.state,
        zip: l.zip,
        avgDelinquency: l.avgDelinquency,
        performanceStatus: l.performanceStatus,
        ndaRequired: l.ndaRequired,
        status: l.status,
        sellerId,
        createdAt: daysAgo(Math.floor(Math.random() * 45) + 5),
      },
    })
    listingMap[l.n] = listing.id
  }
  console.log(`  ✓ Listings: ${Object.keys(listingMap).length} upserted`)

  // 3) Bids ──────────────────────────────────────────────────────────────
  let bidCount = 0
  for (const b of DEMO_BIDS) {
    const listingId = listingMap[b.listingN]
    const bidderId = userIdxToId[b.buyerIdx]
    // Idempotency: skip if a bid with same listing+bidder+amount already exists
    const exists = await prisma.bid.findFirst({
      where: { listingId, bidderId, amount: b.amount },
    })
    if (exists) continue
    await prisma.bid.create({
      data: {
        listingId,
        bidderId,
        amount: b.amount,
        status: b.status,
        counterAmount: b.counterAmount,
        message: b.message,
        createdAt: daysAgo(b.daysAgo),
      },
    })
    bidCount++
  }
  console.log(`  ✓ Bids: ${bidCount} created`)

  // 4) NDAs ──────────────────────────────────────────────────────────────
  let ndaCount = 0
  for (const n of DEMO_NDAS) {
    const listingId = listingMap[n.listingN]
    const buyerId = userIdxToId[n.buyerIdx]
    try {
      await prisma.ndaAgreement.create({
        data: { listingId, buyerId, signedAt: daysAgo(Math.floor(Math.random() * 20) + 1) },
      })
      ndaCount++
    } catch (e) {
      // unique constraint — already exists
    }
  }
  console.log(`  ✓ NDAs:   ${ndaCount} created`)

  // 5) Saved listings (watchlist) ────────────────────────────────────────
  let savedCount = 0
  for (const s of DEMO_SAVED) {
    const userId = s.userEmail === 'eddy@dlcep.com' ? eddyUser?.id : adminUser?.id
    if (!userId) continue
    const listingId = listingMap[s.listingN]
    try {
      await prisma.savedListing.create({ data: { userId, listingId } })
      savedCount++
    } catch (e) { /* unique constraint */ }
  }
  console.log(`  ✓ Saved:  ${savedCount} created`)

  // 6) Deal pipeline ─────────────────────────────────────────────────────
  let pipeCount = 0
  for (const p of DEMO_PIPELINE) {
    const userId = p.userEmail === 'eddy@dlcep.com' ? eddyUser?.id : adminUser?.id
    if (!userId) continue
    const listingId = listingMap[p.listingN]
    await prisma.dealPipeline.upsert({
      where: { userId_listingId: { userId, listingId } },
      update: { stage: p.stage, notes: p.notes },
      create: { userId, listingId, stage: p.stage, notes: p.notes },
    })
    pipeCount++
  }
  console.log(`  ✓ Pipeline: ${pipeCount} upserted`)

  // 7) Vendors ───────────────────────────────────────────────────────────
  for (const v of DEMO_VENDORS) {
    const existing = await prisma.vendor.findFirst({ where: { name: v.name } })
    if (existing) continue
    await prisma.vendor.create({ data: v })
  }
  const vendorCount = await prisma.vendor.count()
  console.log(`  ✓ Vendors: ${vendorCount} total`)

  // 8) MLPA template ─────────────────────────────────────────────────────
  await prisma.mlpaTemplate.upsert({
    where: { version: DEMO_MLPA.version },
    update: { body: DEMO_MLPA.body, isActive: DEMO_MLPA.isActive, notes: DEMO_MLPA.notes },
    create: DEMO_MLPA,
  })
  console.log(`  ✓ MLPA template: ${DEMO_MLPA.version}`)

  // 9) Notifications ─────────────────────────────────────────────────────
  let notifCount = 0
  for (const n of DEMO_NOTIFICATIONS) {
    const userId = n.userEmail === 'eddy@dlcep.com' ? eddyUser?.id : adminUser?.id
    if (!userId) continue
    // Idempotency: skip if same title already exists
    const exists = await prisma.notification.findFirst({
      where: { userId, title: n.title, body: n.body },
    })
    if (exists) continue
    await prisma.notification.create({
      data: {
        userId,
        type: n.type,
        title: n.title,
        body: n.body,
        createdAt: daysAgo(n.unreadDaysAgo),
      },
    })
    notifCount++
  }
  console.log(`  ✓ Notifications: ${notifCount} created`)

  // 10) NotificationPreference rows for seeded users ─────────────────────
  for (const email of Object.keys(userMap)) {
    await prisma.notificationPreference.upsert({
      where: { userId: userMap[email] },
      update: {},
      create: { userId: userMap[email] },
    })
  }
  console.log(`  ✓ Notification prefs ensured`)

  // ── Summary ───────────────────────────────────────────────────────────
  const [users, activeListings, bids, ndas] = await Promise.all([
    prisma.user.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.bid.count(),
    prisma.ndaAgreement.count(),
  ])
  const totalUpbAgg = await prisma.listing.aggregate({
    where: { status: 'ACTIVE' },
    _sum: { unpaidBalance: true },
  })

  console.log('\n▸ Post-seed marketplace state:')
  console.log(`  Approved users:   ${users}`)
  console.log(`  Active listings:  ${activeListings}`)
  console.log(`  Total UPB:        $${(totalUpbAgg._sum.unpaidBalance ?? 0).toLocaleString()}`)
  console.log(`  Total bids:       ${bids}`)
  console.log(`  Signed NDAs:      ${ndas}`)
  console.log('\n▸ Demo login (all seeded buyers/sellers):')
  console.log('  password: Demo!2026Aurum')
  console.log('\nDone.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
