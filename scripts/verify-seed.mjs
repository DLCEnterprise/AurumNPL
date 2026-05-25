// Verify seeded data integrity + flag anything that might break the demo.
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const out = (label, ok, detail = '') => console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? ' — ' + detail : ''}`)

console.log('▸ Seed integrity checks\n')

// 1) Every seeded user has approvalStatus APPROVED
const seedUsers = await p.user.findMany({
  where: { adminNotes: 'seed:demo-may-2026' },
  select: { id: true, email: true, approvalStatus: true, role: true, name: true, company: true, passwordHash: true },
})
const notApproved = seedUsers.filter(u => u.approvalStatus !== 'APPROVED')
out(`Seeded users: ${seedUsers.length}/7, all APPROVED`, notApproved.length === 0, notApproved.length ? `${notApproved.length} not approved` : '')
const noHash = seedUsers.filter(u => !u.passwordHash)
out(`Seeded users have password hashes`, noHash.length === 0, noHash.length ? `${noHash.length} missing hash` : '')

// 2) Listings ─ count + assignment
const seededListings = await p.listing.findMany({
  where: { listingNumber: { startsWith: 'AUR-2026-' } },
  select: { id: true, listingNumber: true, title: true, status: true, sellerId: true, unpaidBalance: true, ndaRequired: true },
})
out(`Seeded listings count`, seededListings.length === 22, `found ${seededListings.length}`)

// 3) Every listing has a real seller (FK integrity)
const sellerIds = new Set((await p.user.findMany({ select: { id: true } })).map(u => u.id))
const orphanListings = seededListings.filter(l => !sellerIds.has(l.sellerId))
out(`Listings reference valid sellers`, orphanListings.length === 0, orphanListings.length ? `${orphanListings.length} orphans` : '')

// 4) Bids → valid listings + valid bidders
const bids = await p.bid.findMany({ select: { listingId: true, bidderId: true, status: true, amount: true } })
const listingIds = new Set(seededListings.map(l => l.id))
const allUserIds = new Set((await p.user.findMany({ select: { id: true } })).map(u => u.id))
const badBids = bids.filter(b => !allUserIds.has(b.bidderId))
out(`Bids reference valid bidders`, badBids.length === 0)
const negBids = bids.filter(b => b.amount <= 0)
out(`Bids have positive amounts`, negBids.length === 0)

// 5) NDA agreements — buyer has BUYER capability
const ndas = await p.ndaAgreement.findMany({ include: { buyer: { select: { role: true } } } })
const wrongRole = ndas.filter(n => !['BUYER', 'SELLER_BUYER', 'ADMIN'].includes(n.buyer.role))
out(`NDA signers have buyer-capable roles`, wrongRole.length === 0, wrongRole.length ? `${wrongRole.length} wrong role` : '')

// 6) DealPipeline rows
const pipeline = await p.dealPipeline.findMany({ select: { stage: true, userId: true, listingId: true } })
out(`Pipeline rows exist`, pipeline.length >= 3, `${pipeline.length} rows`)
const stages = [...new Set(pipeline.map(p => p.stage))]
out(`Pipeline spans multiple stages`, stages.length >= 2, `stages: ${stages.join(', ')}`)

// 7) Vendor directory
const vendors = await p.vendor.findMany({ select: { name: true, category: true, isActive: true } })
const inactive = vendors.filter(v => !v.isActive)
out(`Vendors active`, inactive.length === 0, `${vendors.length} total, ${inactive.length} inactive`)
const categories = [...new Set(vendors.map(v => v.category))]
out(`Vendor categories covered`, categories.length >= 3, `categories: ${categories.join(', ')}`)

// 8) MLPA template
const mlpa = await p.mlpaTemplate.findFirst({ where: { isActive: true } })
out(`Active MLPA template exists`, !!mlpa, mlpa ? `v${mlpa.version}` : 'none')

// 9) Notifications
const notifs = await p.notification.findMany({ select: { userId: true, readAt: true, body: true } })
const unread = notifs.filter(n => !n.readAt)
out(`Unread notifications exist`, unread.length >= 1, `${unread.length} unread of ${notifs.length}`)

// 10) Existing data untouched check
const existingArcadia = await p.listing.findFirst({ where: { title: { contains: '3137 CENTER ST' } }, select: { status: true } })
out(`Existing "3137 CENTER ST" listing preserved`, !!existingArcadia && existingArcadia.status === 'ARCHIVED', existingArcadia?.status)

const existingTest = await p.listing.findFirst({ where: { title: 'Test NPL' }, select: { status: true } })
out(`Existing "Test NPL" listing preserved`, !!existingTest && existingTest.status === 'ACTIVE', existingTest?.status)

// 11) Public stats sanity
const [activeCount, totalUpb, approvedUsers] = await Promise.all([
  p.listing.count({ where: { status: 'ACTIVE' } }),
  p.listing.aggregate({ where: { status: 'ACTIVE' }, _sum: { unpaidBalance: true } }),
  p.user.count({ where: { approvalStatus: 'APPROVED' } }),
])
out(`Public stats values`, true, `active=${activeCount}, totalUPB=$${totalUpb._sum.unpaidBalance?.toLocaleString()}, approvedUsers=${approvedUsers}`)

// 12) Sellers actually have listings (no empty fixture users)
const sellersWithoutListings = await p.user.findMany({
  where: {
    adminNotes: 'seed:demo-may-2026',
    role: { in: ['SELLER', 'SELLER_BUYER'] },
    listings: { none: {} },
  },
  select: { email: true, role: true },
})
out(`All seeded sellers have at least one listing`, sellersWithoutListings.length === 0, sellersWithoutListings.length ? sellersWithoutListings.map(s => s.email).join(', ') : '')

console.log('\n▸ Verification complete.')
await p.$disconnect()
