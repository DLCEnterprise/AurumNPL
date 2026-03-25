import { SignJWT, jwtVerify } from 'jose'

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET ?? 'fallback-secret-change-in-production'
)
const RESET_SECRET = new TextEncoder().encode(
  (process.env.ADMIN_SECRET ?? 'fallback-secret-change-in-production') + '-reset'
)

export type AdminTokenPayload = {
  userId: string
  action: 'approve' | 'reject'
  nonce: string
}

/** Sign a JWT for admin approve/reject links. Expires in 7 days. */
export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(ADMIN_SECRET)
}

/** Verify and decode an admin JWT. Returns null if invalid/expired. */
export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET)
    return payload as unknown as AdminTokenPayload
  } catch {
    return null
  }
}

export type ResetTokenPayload = { userId: string; nonce: string }

/** Sign a short-lived JWT for password reset links. Expires in 1 hour. */
export async function signResetToken(payload: ResetTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(RESET_SECRET)
}

/** Verify and decode a password reset JWT. Returns null if invalid/expired. */
export async function verifyResetToken(token: string): Promise<ResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, RESET_SECRET)
    return payload as unknown as ResetTokenPayload
  } catch {
    return null
  }
}

/** Format a dollar amount as currency string (e.g. $2.4B, $48.7M, $6.1M) */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`
  }
  return `$${amount.toLocaleString()}`
}

/** Simple random nonce for token replay prevention */
export function generateNonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Initials from a name or company string */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Time-ago string for display (e.g. "2 days ago") */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
