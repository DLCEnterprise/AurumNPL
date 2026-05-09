import { PrismaClient } from '@prisma/client'
import type { AuditAction } from '@/types'

// ─── Audit Logger ─────────────────────────────────────────────────────────────

interface LogAuditOptions {
  action: AuditAction
  listingId?: string
  userId?: string
  details?: string
  ipAddress?: string
}

let _auditFailureCount = 0
const AUDIT_FAILURE_ALERT_THRESHOLD = 5

/**
 * Creates an AuditLog record. Non-blocking — never disrupts the caller.
 * Tracks consecutive failures and escalates warnings when the threshold is hit,
 * so silent data loss is detectable in log monitoring.
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
    _auditFailureCount = 0
  } catch (err) {
    _auditFailureCount++
    if (_auditFailureCount >= AUDIT_FAILURE_ALERT_THRESHOLD) {
      console.error(
        `[audit] CRITICAL: ${_auditFailureCount} consecutive audit log failures. ` +
        `Compliance records are being lost. Check database connectivity. Last action: ${opts.action}`,
        err
      )
    } else {
      console.error(`[audit] Failed to write audit log (attempt ${_auditFailureCount}) for action "${opts.action}":`, err)
    }
  }
}
