# AURUM NPL Marketplace — Owner & Admin Guide

---

## Table of Contents

1. [What Is AURUM](#1-what-is-aurum)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Initial Setup (New Machine)](#3-initial-setup-new-machine)
4. [Environment Variables](#4-environment-variables)
5. [Creating Your Admin Account](#5-creating-your-admin-account)
6. [Running the App Locally](#6-running-the-app-locally)
7. [Deploying to Vercel](#7-deploying-to-vercel)
8. [User Approval Workflow](#8-user-approval-workflow)
9. [Feature Guide](#9-feature-guide)
   - [Excel Import](#91-excel-import)
   - [Asset Detail View](#92-asset-detail-view)
   - [Yield Calculator](#93-yield-calculator)
   - [Messaging](#94-messaging)
   - [User Profiles](#95-user-profiles)
10. [Database Management](#10-database-management)
11. [Ongoing Maintenance](#11-ongoing-maintenance)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What Is AURUM

AURUM is a private, institutional-grade B2B marketplace for non-performing loan (NPL) transactions. It connects:

- **Sellers** — institutions listing NPL portfolios or individual loans for sale
- **Buyers / Investors** — funds and private investors acquiring distressed debt

Access is gated — all new registrations require manual admin approval before a user can log in. This keeps the platform institutional and private.

---

## 2. Tech Stack & Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (hosted on Neon) |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) |
| Email | Resend |
| Hosting | Vercel |
| Rate Limiting | Upstash Redis (prod) / in-memory (dev) |
| Excel Parsing | SheetJS (xlsx) |

---

## 3. Initial Setup (New Machine)

### Prerequisites
- **Node.js** — download from nodejs.org (LTS version)
- **VS Code** — recommended editor
- **Git** — for version control

### Steps

```bash
# 1. Clone the repository
git clone <your-github-repo-url>
cd aurum-npl

# 2. Install dependencies
npm install

# 3. Create your .env file (see Section 4)

# 4. Apply the database schema
npx prisma migrate deploy

# 5. Start the dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 4. Environment Variables

Create a `.env` file in the project root with these values. Never commit this file to Git.

```env
# Database (get from neon.tech dashboard)
DATABASE_URL="postgresql://..."

# Auth (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"        # Change to your Vercel URL in production

# Admin
ADMIN_EMAIL="your@email.com"               # Where approval notification emails go
ADMIN_SECRET="another-32-char-secret"      # Signs the approve/reject JWT tokens

# Email (get from resend.com)
RESEND_API_KEY="re_..."

# Rate Limiting (optional — get from upstash.com)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Google Maps (optional — for street view on asset detail pages)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# App
BASE_URL="http://localhost:3000"           # Change to your Vercel URL in production
NODE_ENV="development"
```

### Production values (Vercel)
Change these two when adding env vars to Vercel:
- `NEXTAUTH_URL` → `https://your-app.vercel.app`
- `BASE_URL` → `https://your-app.vercel.app`

---

## 5. Creating Your Admin Account

Because all signups require approval, you need to create your admin account directly in the database.

### Step 1 — Generate a password hash

Open a terminal in the project folder and run:

```bash
node -e "const b=require('bcryptjs');b.hash('YourPassword123!',12).then(h=>console.log(h))"
```

Copy the output (it starts with `$2a$12$...`).

### Step 2 — Open Prisma Studio

```bash
npx prisma studio
```

This opens `http://localhost:5555` in your browser.

### Step 3 — Create the record

1. Click **User** in the left sidebar
2. Click **Add record**
3. Fill in the fields:
   - `name` — your name
   - `email` — your email address
   - `passwordHash` — paste the hash from Step 1
   - `company` — your company name
   - `role` — set to `ADMIN`
   - `approvalStatus` — set to `APPROVED`
4. Click **Save**

You can now log in at `/signin` with your email and the password you hashed.

---

## 6. Running the App Locally

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

To also run Prisma Studio (database viewer), open a **second terminal**:

```bash
npx prisma studio
```

Database viewer runs at `http://localhost:5555`.

---

## 7. Deploying to Vercel

### First deployment

1. Push your code to GitHub
2. Go to vercel.com → Import your repository
3. Add all environment variables from Section 4 (use your production URLs)
4. Vercel runs `npm run build` automatically — this includes `prisma generate`

### Subsequent deployments

```bash
git add .
git commit -m "your message"
git push
```

Vercel auto-deploys on every push to `main`.

### Database migrations on production

When you change the Prisma schema, run after pushing:

```bash
npx prisma migrate deploy
```

Or add this to your Vercel build command: `prisma migrate deploy && next build`

---

## 8. User Approval Workflow

This is the core access-control mechanism of AURUM.

### How it works

1. A user visits `/signup` and submits their application (name, email, company, role)
2. Their account is created with `approvalStatus: PENDING` — they **cannot log in yet**
3. You receive an email at your `ADMIN_EMAIL` with:
   - The user's details
   - An **Approve** button (green)
   - A **Reject** button (red)
4. Clicking Approve → user gets a welcome email and can now log in
5. Clicking Reject → user gets a rejection email

### Approval links
- Links are **single-use** and expire after **7 days**
- Each link is JWT-signed with your `ADMIN_SECRET`
- Once used, clicking again does nothing

### Manual approval (via Prisma Studio)
If email isn't working, you can approve users manually:
1. Open Prisma Studio (`npx prisma studio`)
2. Click **User** → find the user
3. Change `approvalStatus` from `PENDING` to `APPROVED`
4. Save

### Rejecting / suspending a user
Set their `approvalStatus` to `REJECTED` in Prisma Studio. They will be immediately locked out.

---

## 9. Feature Guide

### 9.1 Excel Import

**Who uses it:** Sellers importing loan data from an Aurum Trader-format spreadsheet.

**How to use:**
1. Go to **Listings → Import from Spreadsheet** (or navigate to `/listings/import`)
2. Drag and drop your `.xlsx` file onto the upload zone (max 10 MB)
3. Click **Parse & Preview** — the system reads the spreadsheet and shows a summary:
   - Property address
   - First mortgage current balance
   - Loan status
   - Fair market value
   - LTV
   - Any fields it couldn't read (warnings)
4. If the preview looks correct, click **View Listing** to go to the full detail page

**What gets imported:**
- Full property data (address, FMV, occupancy, purchase info)
- LTV / CLTV metrics
- First and second mortgage data (current terms, modification terms, foreclosure status)
- Bankruptcy history (current and previous Ch.7 / Ch.13)
- Investor profile data from the INVESTOR sheet (if present)

**Spreadsheet format:**
The parser is built for the Aurum Trader vertical form layout:
- Labels in columns C and F
- Values in columns D and G
- The parser is fuzzy — it handles minor label variations

**If fields don't parse correctly:**
The parser logs unrecognised labels as warnings (shown in the collapsible warnings section after upload). If important fields are missing, the label in the spreadsheet may differ from what the parser expects. You can update the label map in `src/lib/excel-parser.ts`.

---

### 9.2 Asset Detail View

After a listing is imported, the detail page (`/listings/[id]`) shows a rich, collapsible breakdown of all loan data organised into sections:

| Section | Contents |
|---|---|
| Property Overview | Street view photo, address, FMV, LTV gauges, computed metrics |
| First Mortgage — Current | Balance, rate, payment, dates |
| First Mortgage — Modification | Modified terms (only shown if loan was modified) |
| First Mortgage — Foreclosure | Default date, amount, sale date (only if in foreclosure) |
| Second Mortgage | Same structure as first (only shown if second mortgage exists) |
| Bankruptcy | Current status + Ch.7 / Ch.13 history |

**Computed metrics shown automatically:**
- Total Debt (1st + 2nd mortgage)
- Equity Position
- Equity %
- Monthly Payment
- Annual Debt Service
- Months Delinquent
- Estimated Total Arrears

**Street View photos:**
Add a `GOOGLE_MAPS_API_KEY` to your `.env` to enable automatic Google Street View images for each property. Without it, a placeholder icon shows instead.

---

### 9.3 Yield Calculator

**Public version:** `/tools/yield-calculator` — no login required. Anyone can use this as a lead-gen tool.

**From a listing:** Click **Calculate Yield** on any asset detail page. The calculator pre-fills with the listing's monthly payment and remaining term.

**How to use:**

| Step | Input |
|---|---|
| 1 | How much will you pay/receive today? (the purchase price) |
| 2 | Payment frequency (Monthly / Quarterly / 2 per year / Yearly) |
| 3 | Payment amount per period |
| 4 | Duration (years or months) |
| 5 | Terminal value at the end (balloon payment, payoff, or 0) |

Click **What is my Return?** to see:
- **Annualized IRR** — the headline return metric
- **Total Return %**
- **Cash-on-Cash (Year 1)**
- **Net Profit** in dollars
- **Total Received / Total Paid**
- **Investment summary** sentence

---

### 9.4 Messaging

Buyers can contact sellers directly through the platform.

**Starting a conversation:**
1. Open any active listing
2. Click **Contact Seller**
3. Type an initial message and send

**Viewing messages:**
- Go to **Messages** in the navigation
- All conversations are listed with the other party's name, company, and last message
- Unread message counts shown as badges
- Messages refresh every 5 seconds automatically

---

### 9.5 User Profiles

**Basic profile** (all users):
- Name, company, phone
- Password change

**Investor profile** (buyers):
- Entity name, signer's title
- Years of experience, investor type
- Lien position preference, loan status preference
- Main investment objective

**Loan Servicer section** (buyers):
- Servicer name and address
- Boarding department contact name, phone, email
- This information facilitates post-sale loan transfers

---

## 10. Database Management

### Prisma Studio (visual editor)
```bash
npx prisma studio
```
Opens at `http://localhost:5555`. You can view, add, edit, and delete any record directly.

### Useful tables to monitor
- **User** — approve/reject pending users, check roles
- **Listing** — view all listings, change status manually
- **Asset** — view parsed loan data for any listing
- **AdminToken** — check approval link usage (usedAt field)
- **Conversation / Message** — review messaging activity

### Schema changes
When you update `prisma/schema.prisma`:
```bash
# Development
npx prisma migrate dev --name describe_your_change

# Production
npx prisma migrate deploy
```

---

## 11. Ongoing Maintenance

### Adding a new user manually
Use Prisma Studio (see Section 5) — useful for inviting specific people without the public signup flow.

### Archiving a listing
From any listing detail page (as the seller or admin), click **Archive**. The listing is hidden from public browsing but the data is preserved.

### Resetting a user's password
Currently no self-service password reset UI. To reset manually:
1. Generate a new bcrypt hash (see Section 5, Step 1)
2. Update the user's `passwordHash` in Prisma Studio

### Monitoring
- Check Vercel's **Functions** tab for API errors
- Check Neon's dashboard for database connection and query stats
- Check Resend's dashboard to confirm approval emails are being delivered

---

## 12. Troubleshooting

### "Environment variable not found: DATABASE_URL"
Your `.env` file is missing or not in the project root. Check that it exists and contains a valid `DATABASE_URL`.

### Users can't log in after approval
Check that `NEXTAUTH_URL` matches the URL they're using. On production, it must be `https://your-app.vercel.app`. On local, `http://localhost:3000`.

### Approval emails not sending
- Confirm `RESEND_API_KEY` is set correctly
- Confirm your sending domain is verified in the Resend dashboard
- Check `ADMIN_EMAIL` is set to a real inbox
- As a fallback, approve users manually via Prisma Studio

### Excel import — fields show as "—" after import
The spreadsheet labels may differ slightly from what the parser expects. After importing:
1. Check the parser warnings shown on the import page
2. Look for "Unrecognised label: ..." warnings
3. Add the label variation to the map in `src/lib/excel-parser.ts`

### Build fails on Vercel
- Ensure all required environment variables are added in Vercel's project settings
- Check that `DATABASE_URL` points to your production Neon database
- Run `npx prisma migrate deploy` if you have unapplied migrations

### "Too many requests" error
Rate limiting is working as intended. Limits:
- Signup: 5 per hour per IP
- Sign in: 10 per 15 minutes per IP
- API: 100 per minute per user

In development these use in-memory rate limiting and reset when you restart the server.

---

*Last updated: March 2026*
