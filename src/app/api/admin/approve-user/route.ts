import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/utils'
import { sendWelcomeEmail, sendRejectionEmail } from '@/lib/email'

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
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">◈ AURUM</div>
    <div class="icon">${isError ? '⚠️' : title.includes('Approved') ? '✅' : '✗'}</div>
    <h1>${title}</h1>
    ${body}
    <p style="margin-top:24px;font-size:0.8rem;"><a href="${process.env.BASE_URL ?? 'http://localhost:3000'}">← Return to AURUM</a></p>
  </div>
</body>
</html>`

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse(
      HTML('Invalid Link', '<p>This approval link is missing or malformed.</p>', true),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // 1. Verify JWT signature + expiry
  const payload = await verifyAdminToken(token)
  if (!payload) {
    return new NextResponse(
      HTML('Link Expired', '<p>This approval link has expired or is invalid. Please check for a newer email.</p>', true),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // 2. Check replay — token must exist and not be used
  const adminToken = await prisma.adminToken.findUnique({ where: { token } })
  if (!adminToken || adminToken.usedAt !== null) {
    return new NextResponse(
      HTML('Already Used', '<p>This approval link has already been used and cannot be reused.</p>', true),
      { status: 409, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // 3. Load user
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    return new NextResponse(
      HTML('User Not Found', '<p>The user associated with this link could not be found.</p>', true),
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (user.approvalStatus !== 'PENDING') {
    return new NextResponse(
      HTML(
        'Already Processed',
        `<p>This account (${user.email}) has already been ${user.approvalStatus.toLowerCase()}.</p>`
      ),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const now = new Date()
  const isApprove = payload.action === 'approve'

  // 4. Update user + mark token used atomically
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        approvalStatus: isApprove ? 'APPROVED' : 'REJECTED',
        approvedAt: isApprove ? now : null,
        approvedBy: 'admin',
      },
    }),
    prisma.adminToken.update({
      where: { token },
      data: { usedAt: now },
    }),
    // Also mark the paired token (same userId) as used to prevent partial reuse
    prisma.adminToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    }),
  ])

  // 5. Send notification to user
  if (isApprove) {
    await sendWelcomeEmail(user.email, user.name ?? 'there')
    return new NextResponse(
      HTML(
        'User Approved',
        `<p><strong>${user.name ?? user.email}</strong> has been approved and notified via email. They may now sign in to AURUM.</p>`
      ),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } else {
    await sendRejectionEmail(user.email, user.name ?? 'there')
    return new NextResponse(
      HTML(
        'Application Rejected',
        `<p><strong>${user.name ?? user.email}</strong>&apos;s application has been rejected. They have been notified via email.</p>`
      ),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }
}
