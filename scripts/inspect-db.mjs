// One-off DB sentinel probe. Counts only — no PII printed.
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const [users, listings, bids, conversations, messages, deals, ndas] = await Promise.all([
  prisma.user.count(),
  prisma.listing.count(),
  prisma.bid.count(),
  prisma.conversation.count(),
  prisma.message.count(),
  prisma.dealPipeline.count(),
  prisma.ndaAgreement.count(),
])

const usersByStatus = await prisma.user.groupBy({
  by: ['approvalStatus'],
  _count: { id: true },
})

const listingsByStatus = await prisma.listing.groupBy({
  by: ['status'],
  _count: { id: true },
})

// Email-domain breakdown — domain only, not the full email
const allEmails = await prisma.user.findMany({ select: { email: true } })
const domainCounts = {}
for (const { email } of allEmails) {
  const d = email.split('@')[1] ?? '(none)'
  domainCounts[d] = (domainCounts[d] ?? 0) + 1
}

console.log(JSON.stringify({
  totals: { users, listings, bids, conversations, messages, deals, ndas },
  usersByStatus: Object.fromEntries(usersByStatus.map(r => [r.approvalStatus, r._count.id])),
  listingsByStatus: Object.fromEntries(listingsByStatus.map(r => [r.status, r._count.id])),
  emailDomains: domainCounts,
}, null, 2))

await prisma.$disconnect()
