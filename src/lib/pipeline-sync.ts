import { prisma } from '@/lib/prisma'
import { DealStage } from '@prisma/client'

const STATUS_TO_STAGE: Partial<Record<string, DealStage>> = {
  OFFER_ACCEPTED: DealStage.UNDER_LOI,
  DUE_DILIGENCE:  DealStage.UNDER_LOI,
  CLOSING:        DealStage.CLOSING,
  SOLD:           DealStage.CLOSED,
}

/** Advance all pipeline entries for a listing when its status changes. */
export async function syncPipelineStage(listingId: string, listingStatus: string): Promise<void> {
  const stage = STATUS_TO_STAGE[listingStatus]
  if (!stage) return
  await prisma.dealPipeline.updateMany({ where: { listingId }, data: { stage } })
}

/** Upsert the bidder's pipeline entry to BIDDING when they submit a bid. */
export async function moveToBidding(listingId: string, userId: string): Promise<void> {
  await prisma.dealPipeline.upsert({
    where:  { userId_listingId: { userId, listingId } },
    create: { userId, listingId, stage: DealStage.BIDDING },
    update: { stage: DealStage.BIDDING },
  })
}
