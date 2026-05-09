import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { sendWelcomeEmail, sendRejectionEmail } from '@/lib/email'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const NO_CACHE = { 'Cache-Control': 'no-store', 'Content-Type': 'text/html' }
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

const HTML = (title: string, body: string, isError = false) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} | AURUM</title>
  <style>
    body{margin:0;padding:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
         background:#09090b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#f4f4f5;}
    .card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
          border-radius:16px;padding:48px 40px;max-width:480px;text-align:center;}
    .icon{font-size:2.5rem;margin-bottom:20px;}
    h1{font-size:1.6rem;font-weight:400;margin-bottom:12px;}
    p{color:#a1a1aa;font-size:0.95rem;line-height:1.7;}
    .logo{font-size:1.2rem;letter-spacing:.15em;margin-bottom:32px;
          background:linear-gradient(135deg,#d4a846,#f5d98a,#d4a846);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;}
    a{color:#d4a846;text-decoration:none;}
    .meta{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);
          border-radius:8px;padding:16px 20px;margin:20px 0;text-align:left;}
    .meta-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;}
    .meta-label{color:#71717a;}
    .meta-value{color:#f4f4f5;font-weight:500;}
    .btn-gold{display:inline-block;padding:12px 28px;margin:6px 4px;
              background:linear-gradient(135deg,#d4a846,#f5d98a,#d4a846);
              color:#0a0a0a;font-weight:700;font-size:14px;letter-spacing:.04em;
              text-decoration:none;border-radius:6px;border:none;cursor:pointer;font-family:inherit;}
    .btn-ghost{display:inline-block;padding:12px 28px;margin:6px 4px;
               border:1px solid rgba(255,255,255,0.1);color:#a1a1aa;background:transparent;
               font-size:14px;letter-spacing:.04em;text-decoration:none;
               border-radius:6px;cursor:pointer;font-family:inherit;}
    .warning{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);
             border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#fca5a5;}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">◈ AURUM</div>
    <div class="icon">${isError ? '⚠️' : title.includes('Approved') ? '✅' : title.includes('Rejected') ? '✗' : '🔍'}</div>
    <h1>${title}</h1>
    ${body}
    <p style="margin-top:24px;font-size:0.8rem;"><a href="${BASE_URL}">← Return to AURUM</a></p>
  </div>
</body>
</html>`

// ─── GET — validate token and show confirmation page ─────────────────────────

export async function GET(req: NextRequest) {
  const rl = await rateLimit('admin', getIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  const { searchParams } = req.nextUrl
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse(
      HTML('Invalid Link', '<p>This approval link is missing or malformed.</p>', true),
      { status: 400, headers: NO_CACHE }
    )
  }

  // Verify JWT signature + expiry
  const payload = await verifyAdminToken(token)
  if (!payload) {
    return new NextResponse(
      HTML('Link Expired', '<p>This approval link has expired or is invalid. Please check for a newer email.</p>', true),
      { status: 400, headers: NO_CACHE }
    )
  }

  // Check replay (look up by hash — raw JWT is never stored in DB)
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const adminToken = await prisma.adminToken.findUnique({ where: { token: tokenHash } })
  if (!adminToken || adminToken.usedAt !== null) {
    return new NextResponse(
      HTML('Already Used', '<p>This approval link has already been used and cannot be reused.</p>', true),
      { status: 409, headers: NO_CACHE }
    )
  }

  // Load user
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    return new NextResponse(
      HTML('User Not Found', '<p>The user associated with this link could not be found.</p>', true),
      { status: 404, headers: NO_CACHE }
    )
  }

  if (user.approvalStatus !== 'PENDING') {
    return new NextResponse(
      HTML(
        'Already Processed',
        `<p>This account (<strong>${escapeHtml(user.email)}</strong>) has already been ${user.approvalStatus.toLowerCase()}.</p>`
      ),
      { status: 200, headers: NO_CACHE }
    )
  }

  // Check admin session — if not logged in, redirect to sign-in with return URL
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    const returnUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(`${BASE_URL}/signin?callbackUrl=${returnUrl}`, { status: 302 })
  }

  const isApprove = payload.action === 'approve'
  const actionLabel = isApprove ? 'Approve Access' : 'Reject Application'
  const actionColor = isApprove ? 'btn-gold' : 'btn-ghost'

  const confirmationBody = `
    <p>You are about to <strong>${isApprove ? 'approve' : 'reject'}</strong> the following user application.</p>
    <div class="meta">
      <div class="meta-row"><span class="meta-label">Name</span><span class="meta-value">${escapeHtml(user.name ?? '—')}</span></div>
      <div class="meta-row"><span class="meta-label">Email</span><span class="meta-value">${escapeHtml(user.email)}</span></div>
      <div class="meta-row"><span class="meta-label">Company</span><span class="meta-value">${escapeHtml(user.company ?? '—')}</span></div>
      <div class="meta-row"><span class="meta-label">Role</span><span class="meta-value">${escapeHtml(user.role)}</span></div>
    </div>
    <div class="warning">This action is irreversible and will immediately notify the applicant via email.</div>
    <form method="POST" action="/api/admin/approve-user">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <button type="submit" class="${actionColor}">${actionLabel}</button>
    </form>
    <p style="margin-top:12px;font-size:0.8rem;">
      <a href="${BASE_URL}/admin/users">← Manage all users in the admin dashboard</a>
    </p>
  `

  return new NextResponse(
    HTML(`Confirm: ${actionLabel}`, confirmationBody),
    { status: 200, headers: NO_CACHE }
  )
}

// ─── POST — execute action (requires active admin session) ───────────────────

export async function POST(req: NextRequest) {
  // Require admin session
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse(
      HTML('Unauthorized', '<p>You must be signed in as an administrator to perform this action.</p>', true),
      { status: 403, headers: NO_CACHE }
    )
  }

  // Parse form body
  const body = await req.formData().catch(() => null)
  const token = body?.get('token')?.toString() ?? ''

  if (!token) {
    return new NextResponse(
      HTML('Invalid Request', '<p>No approval token was provided.</p>', true),
      { status: 400, headers: NO_CACHE }
    )
  }

  // Verify JWT
  const payload = await verifyAdminToken(token)
  if (!payload) {
    return new NextResponse(
      HTML('Link Expired', '<p>This approval link has expired or is invalid.</p>', true),
      { status: 400, headers: NO_CACHE }
    )
  }

  // Check replay (look up by hash — raw JWT is never stored in DB)
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const adminToken = await prisma.adminToken.findUnique({ where: { token: tokenHash } })
  if (!adminToken || adminToken.usedAt !== null) {
    return new NextResponse(
      HTML('Already Used', '<p>This approval link has already been used.</p>', true),
      { status: 409, headers: NO_CACHE }
    )
  }

  // Load user
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    return new NextResponse(
      HTML('User Not Found', '<p>The user associated with this link could not be found.</p>', true),
      { status: 404, headers: NO_CACHE }
    )
  }

  if (user.approvalStatus !== 'PENDING') {
    return new NextResponse(
      HTML(
        'Already Processed',
        `<p>This account (${escapeHtml(user.email)}) has already been ${user.approvalStatus.toLowerCase()}.</p>`
      ),
      { status: 200, headers: NO_CACHE }
    )
  }

  const now = new Date()
  const isApprove = payload.action === 'approve'

  // Update user + mark all paired tokens used atomically
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        approvalStatus: isApprove ? 'APPROVED' : 'REJECTED',
        approvedAt: isApprove ? now : null,
        approvedBy: session.user.email ?? 'admin',
      },
    }),
    prisma.adminToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    }),
  ])

  // Notify applicant
  if (isApprove) {
    await sendWelcomeEmail(user.email, user.name ?? 'there')
    return new NextResponse(
      HTML(
        'User Approved',
        `<p><strong>${escapeHtml(user.name ?? user.email)}</strong> has been approved and notified via email. They may now sign in to AURUM.</p>`
      ),
      { status: 200, headers: NO_CACHE }
    )
  } else {
    await sendRejectionEmail(user.email, user.name ?? 'there')
    return new NextResponse(
      HTML(
        'Application Rejected',
        `<p><strong>${escapeHtml(user.name ?? user.email)}</strong>&apos;s application has been rejected. They have been notified via email.</p>`
      ),
      { status: 200, headers: NO_CACHE }
    )
  }
}
