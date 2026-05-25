import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const users = await p.user.findMany({
  select: { email: true, role: true, approvalStatus: true, name: true, company: true },
})
const mlpaTemplates = await p.mlpaTemplate.count()
const vendors = await p.vendor.count()
const listings = await p.listing.findMany({
  select: { listingNumber: true, title: true, status: true, assetType: true, sellerId: true },
})

console.log(JSON.stringify({ users, mlpaTemplates, vendors, listings }, null, 2))
await p.$disconnect()
