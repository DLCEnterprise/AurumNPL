import { PrismaClient } from '@prisma/client'

// ─── Audit Logger ─────────────────────────────────────────────────────────────

interface LogAuditOptions {
  action: string
  listingId?: string
  userId?: string
  details?: string
  ipAddress?: string
}

/**
 * Creates an AuditLog record. Non-blocking — catches and swallows errors
 * so a logging failure never disrupts the calling operation.
 */
export async function logAudit(
  prisma: PrismaClient,
  opts: LogAuditOptions
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action:    opts.action,
        listingId: opts.listingId,
        userId:    opts.userId,
        details:   opts.details,
        ipAddress: opts.ipAddress,
      },
    })
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err)
  }
}
