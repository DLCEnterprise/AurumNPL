import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { YieldCalculator } from '@/components/tools/YieldCalculator'
import type { YieldPrefill } from '@/components/tools/YieldCalculator'

export const metadata: Metadata = {
  title: 'NPL Yield Calculator — Calculate Your Return on Non-Performing Loans | AURUM',
  description: 'Free IRR and yield calculator for non-performing loans. Calculate your annualized return, total yield, and cash-on-cash on any NPL or distressed mortgage investment.',
}

export default async function YieldCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ listingId?: string }>
}) {
  const { listingId } = await searchParams
  const session = await auth()
  const isAuthenticated = !!session

  let prefill: YieldPrefill | undefined
  let listingTitle: string | null = null

  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        asset: {
          select: {
            firstMtg_monthlyPI: true,
            firstMtg_modMonthlyPI: true,
            firstMtg_isModified: true,
            firstMtg_monthsRemaining: true,
            firstMtg_modPaymentsRemaining: true,
          },
        },
      },
    })

    if (listing?.asset) {
      const a = listing.asset
      const payment = a.firstMtg_isModified
        ? (a.firstMtg_modMonthlyPI ?? a.firstMtg_monthlyPI ?? undefined)
        : (a.firstMtg_monthlyPI ?? undefined)
      const months = a.firstMtg_isModified
        ? (a.firstMtg_modPaymentsRemaining ?? a.firstMtg_monthsRemaining ?? undefined)
        : (a.firstMtg_monthsRemaining ?? undefined)
      prefill = {
        paymentAmount: payment ?? undefined,
        durationMonths: months ?? undefined,
      }
      listingTitle = listing.title
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: '0' }}>
      {/* Nav */}
      <nav style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(9,9,11,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.1rem', letterSpacing: '0.15em', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 600 }}>
            ◈ AURUM
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAuthenticated
            ? <Link href="/dashboard" className="btn btn--ghost btn--sm">Dashboard</Link>
            : <>
                <Link href="/signin" className="btn btn--ghost btn--sm">Sign In</Link>
                <Link href="/signup" className="btn btn--gold btn--sm">Get Access</Link>
              </>
          }
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Back to listing */}
        {listingId && (
          <Link href={`/listings/${listingId}`} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            {listingTitle ? `Back to ${listingTitle}` : 'Back to Listing'}
          </Link>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 400, marginBottom: '12px', lineHeight: 1.2 }}>
            What is my Return on Investment?
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto' }}>
            Calculate IRR, total yield, and cash-on-cash for any non-performing loan investment.
          </p>
        </div>

        {/* Calculator card */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <YieldCalculator prefill={prefill} showSignupCta={!isAuthenticated} />
        </div>

        {/* Explainer */}
        <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
          {[
            { label: 'IRR', desc: 'Annualized Internal Rate of Return — the true time-value yield on your investment.' },
            { label: 'Total Return', desc: 'Net profit as a percentage of total cash invested.' },
            { label: 'Cash-on-Cash', desc: 'Year-1 income divided by your initial investment.' },
          ].map(({ label, desc }) => (
            <div key={label} className="glass-card" style={{ padding: '20px 16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '6px', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {label}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
