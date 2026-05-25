import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const users = await p.user.findMany({
  select: { email: true, role: true, approvalStatus: true, termsVersion: true, adminNotes: true },
  orderBy: { createdAt: 'asc' },
})
console.log('Email                                          | Role         | Status   | Terms | Seed?')
console.log('-----------------------------------------------|--------------|----------|-------|-----')
for (const u of users) {
  const seed = u.adminNotes === 'seed:demo-may-2026' ? 'yes' : 'no'
  console.log(`${u.email.padEnd(46)} | ${u.role.padEnd(12)} | ${u.approvalStatus.padEnd(8)} | ${(u.termsVersion ?? '—').padEnd(5)} | ${seed}`)
}
await p.$disconnect()
