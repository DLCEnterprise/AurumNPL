import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}
const FROM = 'AURUM <noreply@aurum.finance>'
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

// ─── Shared HTML wrapper ────────────────────────────────────────────────────

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>AURUM</title>
  <style>
    body { margin:0; padding:0; background:#09090b; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; color:#f4f4f5; }
    .wrap { max-width:560px; margin:0 auto; padding:48px 24px; }
    .logo { font-size:22px; font-weight:700; letter-spacing:.15em; color:#f4f4f5; margin-bottom:40px; }
    .logo span { background:linear-gradient(135deg,#d4a846 0%,#f5d98a 50%,#d4a846 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:40px 36px; }
    h1 { font-size:24px; font-weight:400; margin:0 0 12px; line-height:1.3; }
    p { color:#a1a1aa; font-size:15px; line-height:1.7; margin:0 0 16px; }
    .btn-gold {
      display:inline-block; padding:14px 28px;
      background:linear-gradient(135deg,#d4a846 0%,#f5d98a 50%,#d4a846 100%);
      color:#0a0a0a; font-weight:700; font-size:14px;
      letter-spacing:.04em; text-decoration:none;
      border-radius:6px; margin:8px 4px;
    }
    .btn-ghost {
      display:inline-block; padding:14px 28px;
      border:1px solid rgba(255,255,255,0.1); color:#a1a1aa;
      font-size:14px; letter-spacing:.04em; text-decoration:none;
      border-radius:6px; margin:8px 4px;
    }
    .divider { border:none; border-top:1px solid rgba(255,255,255,0.06); margin:24px 0; }
    .footer-text { font-size:12px; color:#52525b; margin-top:32px; text-align:center; }
    .meta { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:8px; padding:16px 20px; margin:20px 0; }
    .meta-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }
    .meta-label { color:#71717a; }
    .meta-value { color:#f4f4f5; font-weight:500; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">◈ <span>AURUM</span></div>
    ${body}
    <p class="footer-text">© 2026 AURUM. Institutional use only. Not an offer to sell securities.</p>
  </div>
</body>
</html>`
}

// ─── Email functions ────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  await getResend().emails.send({ from: FROM, to, subject, html })
}

// ─── Admin notification ──────────────────────────────────────────────────────

interface AdminNotificationOptions {
  userName: string
  userEmail: string
  userCompany: string
  userRole: string
  signupAt: string
  approveUrl: string
  rejectUrl: string
}

export async function sendAdminNotification(opts: AdminNotificationOptions) {
  const html = emailWrapper(`
    <div class="card">
      <h1>New User Registration</h1>
      <p>A new user has registered on AURUM and is awaiting approval.</p>
      <div class="meta">
        <div class="meta-row">
          <span class="meta-label">Name</span>
          <span class="meta-value">${opts.userName}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Email</span>
          <span class="meta-value">${opts.userEmail}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Company</span>
          <span class="meta-value">${opts.userCompany}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Role</span>
          <span class="meta-value">${opts.userRole}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Registered</span>
          <span class="meta-value">${opts.signupAt}</span>
        </div>
      </div>
      <hr class="divider" />
      <p>Review this application and take action below:</p>
      <a href="${opts.approveUrl}" class="btn-gold">✓ Approve Access</a>
      <a href="${opts.rejectUrl}" class="btn-ghost">✗ Reject Application</a>
      <p style="margin-top:20px;font-size:13px;">These links expire in 7 days and can only be used once.</p>
    </div>
  `)

  await sendEmail({
    to: process.env.ADMIN_EMAIL ?? '',
    subject: `[AURUM] New registration — ${opts.userName} (${opts.userRole})`,
    html,
  })
}

// ─── User welcome ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, userName: string) {
  const html = emailWrapper(`
    <div class="card">
      <h1>Your AURUM account has been approved.</h1>
      <p>Welcome, ${userName}. Your application has been reviewed and approved. You now have full access to the AURUM marketplace.</p>
      <p>You can sign in and begin listing assets or browsing available portfolios immediately.</p>
      <a href="${BASE_URL}/signin" class="btn-gold">Sign In to AURUM →</a>
      <hr class="divider" />
      <p style="font-size:13px;">If you have any questions, contact us at <a href="mailto:support@aurum.finance" style="color:#d4a846;">support@aurum.finance</a>.</p>
    </div>
  `)

  await sendEmail({
    to,
    subject: 'Your AURUM account has been approved',
    html,
  })
}

// ─── User rejection ────────────────────────────────────────────────────────────

export async function sendRejectionEmail(to: string, userName: string) {
  const html = emailWrapper(`
    <div class="card">
      <h1>An update on your AURUM application.</h1>
      <p>Thank you for your interest in AURUM, ${userName}.</p>
      <p>After careful review, we are unable to approve your application at this time. This decision may be based on current platform eligibility requirements or capacity constraints.</p>
      <p>If you believe this decision was made in error, or if you would like to discuss your application further, please reach out to our team.</p>
      <a href="mailto:support@aurum.finance" class="btn-gold">Contact Support</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#71717a;">AURUM is an institutional marketplace. Access is subject to eligibility review.</p>
    </div>
  `)

  await sendEmail({
    to,
    subject: 'Update on your AURUM application',
    html,
  })
}

// ─── Password reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = emailWrapper(`
    <div class="card">
      <h1>Reset your password.</h1>
      <p>We received a request to reset the password for your AURUM account. Click the button below to set a new password.</p>
      <a href="${resetUrl}" class="btn-gold">Reset Password →</a>
      <hr class="divider" />
      <p style="font-size:13px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `)

  await sendEmail({
    to,
    subject: 'Reset your AURUM password',
    html,
  })
}
