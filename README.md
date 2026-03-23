# AURUM — NPL Marketplace

Institutional-grade marketplace for non-performing loan transactions. Sophisticated sellers list distressed-debt portfolios; qualified buyers discover, evaluate, and negotiate deals — all in one secure platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Auth | Auth.js v5 (NextAuth) — credentials + admin approval gate |
| Database | PostgreSQL via Prisma ORM |
| Email | Resend (`@resend/node`) |
| Deployment | Vercel-ready |

## Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database

### 2. Install

```bash
git clone <repo-url>
cd aurum-npl
npm install
```

### 3. Environment

```bash
cp .env.example .env
# Fill in all values in .env
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random 32-char secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | App URL, e.g. `http://localhost:3000` |
| `ADMIN_EMAIL` | ✅ | Email that receives approve/reject notifications |
| `ADMIN_SECRET` | ✅ | Random 32-char secret for signing admin JWTs |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional email |
| `BASE_URL` | ✅ | App base URL (same as `NEXTAUTH_URL`) |
| `UPSTASH_REDIS_REST_URL` | ☑️ prod | Upstash Redis REST URL for serverless rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ☑️ prod | Upstash Redis REST token |

### 4. Database

```bash
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations (creates tables)
# or for quick dev setup:
npm run db:push       # Push schema without migration files
```

### 5. Run

```bash
npm run dev   # http://localhost:3000
```

## Folder Structure

```
src/
├── app/
│   ├── (auth)/               # Sign in, sign up, pending approval
│   ├── (dashboard)/          # Authenticated routes (middleware-protected)
│   │   ├── dashboard/        # Stats overview + quick actions
│   │   ├── listings/         # Browse, create, detail, edit
│   │   ├── messages/         # Real-time-style messaging (5s polling)
│   │   └── profile/          # User profile + password change
│   ├── api/
│   │   ├── auth/             # NextAuth handlers, signup, status
│   │   ├── admin/            # Approve/reject user endpoints
│   │   ├── listings/         # CRUD + soft-delete
│   │   ├── messages/         # Conversations + send message
│   │   └── profile/          # Update profile + change password
│   ├── layout.tsx            # Root layout + ToastProvider
│   └── page.tsx              # Public landing page
├── components/
│   ├── ui/                   # Skeleton, Spinner, Toast, ScrollReveal
│   ├── layout/               # LandingNav, DashboardNav
│   ├── listings/             # CreateListingForm, ListingsFilters, ContactSellerButton, ArchiveListingButton
│   ├── messaging/            # MessagingApp (functional), MessagingPreview (landing demo)
│   └── profile/              # ProfileForm
├── lib/
│   ├── auth.ts               # NextAuth v5 config + approval gate
│   ├── prisma.ts             # Prisma singleton
│   ├── email.ts              # Resend email templates
│   ├── rate-limit.ts         # Dual-backend rate limiter (Upstash / in-memory)
│   ├── api-helpers.ts        # guardRoute() — session + rate limit combined
│   └── utils.ts              # JWT signing, formatCurrency, timeAgo
├── types/index.ts            # Shared TypeScript types
└── styles/globals.css        # Tailwind v4 + luxury CSS variables
```

## Authentication & Approval Flow

1. User submits sign-up form at `/signup`
2. Account is created with `approvalStatus: PENDING`
3. Admin receives email with **Approve** and **Reject** one-click links (JWT-signed, 7-day expiry, single-use)
4. On approval → user receives welcome email, can sign in
5. On rejection → user receives polite rejection email
6. Middleware enforces: unauthenticated → `/signin`, PENDING → `/pending-approval`, REJECTED → `/signin?error=rejected`

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register user, notify admin |
| POST | `/api/auth/status` | Public | Check account approval status |
| GET | `/api/admin/approve-user?token=...` | JWT | Approve or reject user (single-use) |
| GET/POST | `/api/auth/[...nextauth]` | — | NextAuth handlers |
| GET | `/api/listings` | Session | List/filter listings |
| POST | `/api/listings` | Session | Create listing |
| GET | `/api/listings/[id]` | Session | Get listing detail |
| PUT | `/api/listings/[id]` | Session (owner) | Update listing |
| DELETE | `/api/listings/[id]` | Session (owner) | Archive listing (soft-delete) |
| GET | `/api/messages/conversations` | Session | List conversations with unread counts |
| POST | `/api/messages/conversations` | Session | Start a new conversation |
| GET | `/api/messages/conversations/[id]` | Session | Fetch messages (marks read) |
| POST | `/api/messages/conversations/[id]` | Session | Send message |
| PUT | `/api/profile` | Session | Update profile info or change password |

## Deployment Checklist

### Infrastructure
- [ ] Provision PostgreSQL database (Supabase, Railway, Neon, or self-hosted)
- [ ] Create Upstash Redis database for production rate limiting
- [ ] Verify domain and set up DNS

### Environment
- [ ] Copy `.env.example` → `.env` and fill in all required values
- [ ] Set all env vars in Vercel (or host) dashboard
- [ ] Ensure `NEXTAUTH_URL` and `BASE_URL` match the production domain
- [ ] Generate strong secrets: `openssl rand -base64 32` for `NEXTAUTH_SECRET` and `ADMIN_SECRET`

### Database
- [ ] Run `npx prisma migrate deploy` against the production database
- [ ] Verify all tables were created (`prisma studio` or `\dt` in psql)

### Email
- [ ] Add and verify your sending domain in Resend dashboard
- [ ] Update the `from` address in `src/lib/email.ts` to match your verified domain
- [ ] Send a test admin-notification email and confirm approve/reject links work

### Security
- [ ] Confirm CSP, HSTS, and CORS headers are present in production responses
- [ ] Test rate limiting: rapid-fire requests to `/api/auth/signup` should 429 after 5 attempts
- [ ] Verify admin token is single-use (replay the approve link — should return error)

### Functional smoke test
- [ ] Sign up as a new user → check admin email arrives
- [ ] Approve user → check welcome email, user can sign in
- [ ] Reject user → check rejection email, sign-in returns correct error
- [ ] Create a listing, contact seller, exchange messages
- [ ] Profile update and password change work correctly
