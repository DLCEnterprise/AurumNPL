import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * Generates the next AUR-YYYY-NNNNN listing number within a transaction.
 * The counter resets each calendar year.
 */
export async function generateListingNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear()
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`)
  const yearEnd   = new Date(`${year + 1}-01-01T00:00:00.000Z`)

  const count = await tx.listing.count({
    where: { createdAt: { gte: yearStart, lt: yearEnd } },
  })

  const seq = String(count + 1).padStart(5, '0')
  return `AUR-${year}-${seq}`
}

/**
 * Generates the next OFF-NNNNN offer number (global counter, not year-based).
 */
export async function generateOfferNumber(tx: Tx): Promise<string> {
  const count = await tx.bid.count()
  const seq = String(count + 1).padStart(5, '0')
  return `OFF-${seq}`
}
