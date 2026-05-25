import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNav } from '@/components/layout/LandingNav'
import { MessagingPreview } from '@/components/messaging/MessagingPreview'
import { StatsBar } from '@/components/landing/StatsBar'
import { prisma } from '@/lib/prisma'
import { formatCurrency, timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AURUM — Where Distressed Assets Find New Value',
}

const ASSET_TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  RESIDENTIAL: { label: 'Residential', cls: 'residential' },
  COMMERCIAL:  { label: 'Commercial',  cls: 'commercial' },
  CONSUMER:    { label: 'Consumer',    cls: 'consumer' },
  MIXED:       { label: 'Mixed',       cls: 'mixed' },
}

function formatDelinquency(days: number | null | undefined): string {
  if (!days) return '—'
  if (days < 60) return `${days}d`
  const months = Math.round(days / 30)
  if (months < 24) return `${months} months`
  return `${(months / 12).toFixed(1)} years`
}

export default async function HomePage() {
  const previewListings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      title: true,
      assetType: true,
      unpaidBalance: true,
      loanCount: true,
      location: true,
      avgDelinquency: true,
      createdAt: true,
    },
  })

  return (
    <>
      <LandingNav />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero" id="home">
        <div className="hero__bg">
          <div className="hero__grid-overlay" />
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
        </div>
        <div className="hero__content">
          <div className="hero__badge animate-in">
            <span className="hero__badge-dot" />
            Institutional‑Grade NPL Trading Platform
          </div>
          <h1 className="hero__title animate-in" style={{ animationDelay: '.15s' }}>
            Where Distressed<br />Assets Find<br />
            <span className="text-gold">New Value</span>
          </h1>
          <p className="hero__subtitle animate-in" style={{ animationDelay: '.3s' }}>
            AURUM connects sophisticated sellers with qualified buyers in a secure,
            transparent marketplace for non‑performing loans. Premium analytics.
            Direct negotiation. Seamless execution.
          </p>
          <div className="hero__cta animate-in" style={{ animationDelay: '.45s' }}>
            <Link href="/signup" className="btn btn--gold btn--lg">
              List Your Assets
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/listings" className="btn btn--glass btn--lg">
              Explore Marketplace
            </Link>
          </div>
          <div className="hero__stats animate-in" style={{ animationDelay: '.6s' }}>
            <StatsBar />
          </div>
        </div>
        <div className="hero__scroll-indicator">
          <div className="hero__scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section className="about" id="about">
        <div className="container">
          <div className="section-header">
              <span className="section-tag">The Platform</span>
              <h2 className="section-title">
                A marketplace built for the<br />
                <span className="text-gold">complexity of distressed debt</span>
              </h2>
            </div>
          <div className="about__grid">
            <div className="about__card glass-card">
              <div className="about__card-number">01</div>
              <h3>List</h3>
              <p>
                Upload your non‑performing loan portfolios with detailed data — asset type,
                UPB, geography, and status — in a structured, institutional format.
              </p>
            </div>
            <div className="about__card glass-card">
              <div className="about__card-number">02</div>
              <h3>Connect</h3>
              <p>
                Receive expressions of interest from vetted, qualified buyers. Communicate
                directly through our encrypted messaging system.
              </p>
            </div>
            <div className="about__card glass-card">
              <div className="about__card-number">03</div>
              <h3>Transact</h3>
              <p>
                Negotiate terms, share due diligence materials, and close deals — all within
                a single, secure, auditable environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
              <span className="section-tag">Capabilities</span>
              <h2 className="section-title">
                Every tool you need,<br />
                <span className="text-gold">nothing you don&apos;t</span>
              </h2>
            </div>
          <div className="features__grid">
            <div className="feature-card">
              <div className="feature-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M2 7h20M8 21h8M12 17v4" />
                </svg>
              </div>
              <h3 className="feature-card__title">Asset Listings</h3>
              <p className="feature-card__desc">
                Structured, searchable listings with granular filters for asset type,
                geography, UPB range, and loan status.
              </p>
              <div className="feature-card__line" />
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <h3 className="feature-card__title">Secure Messaging</h3>
              <p className="feature-card__desc">
                End‑to‑end encrypted direct messaging. Share documents, negotiate terms,
                and maintain a full audit trail.
              </p>
              <div className="feature-card__line" />
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 20V10M18 20V4M6 20v-4" />
                </svg>
              </div>
              <h3 className="feature-card__title">Seller Dashboard</h3>
              <p className="feature-card__desc">
                Real‑time analytics on views, inquiries, and market comparables.
                Track every listing from post to close.
              </p>
              <div className="feature-card__line" />
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="feature-card__title">Compliance Built‑In</h3>
              <p className="feature-card__desc">
                Regulatory‑ready documentation, KYC/AML verification for all participants,
                and complete transaction logging.
              </p>
              <div className="feature-card__line" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section style={{ padding: '6rem 0', position: 'relative' }}>
        <div className="container">
          <div className="section-header">
              <span className="section-tag">Members</span>
              <h2
                className="section-title"
                style={{ fontFamily: 'var(--font-display)', textAlign: 'center' }}
              >
                What Our Members Say
              </h2>
              <div
                style={{
                  width: '60px',
                  height: '2px',
                  background: 'linear-gradient(90deg, #d4a846, #f5d98a)',
                  margin: '1rem auto 0',
                  borderRadius: '2px',
                }}
              />
            </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginTop: '3rem',
            }}
          >
            {TESTIMONIALS.map((t) => (
              <div key={t.name}
                  className="glass-card"
                  style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                  <span
                    style={{
                      fontSize: '2rem',
                      lineHeight: 1,
                      color: 'var(--gold-300, #d4a846)',
                    }}
                  >
                    ❝
                  </span>
                  <p
                    style={{
                      fontStyle: 'italic',
                      fontSize: '0.95rem',
                      lineHeight: 1.8,
                      color: 'var(--text-secondary, rgba(255,255,255,0.6))',
                      margin: 0,
                    }}
                  >
                    {t.quote}
                  </p>
                  <div
                    style={{
                      height: '1px',
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />
                  <div>
                    <p
                      style={{
                        margin: '0 0 0.15rem',
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      {t.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary, rgba(255,255,255,0.45))',
                      }}
                    >
                      {t.title} — {t.company}
                    </p>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ VIDEO / DEMO PLACEHOLDER ═══════════════ */}
      <section style={{ padding: '4rem 0 6rem' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '2.5rem' }}>
              <span className="section-tag">Demo</span>
              <h2 className="section-title">
                See AURUM <span className="text-gold">in Action</span>
              </h2>
            </div>
            <a
              href="#"
              className="glass-card"
              style={{
                display: 'block',
                position: 'relative',
                aspectRatio: '16 / 9',
                borderRadius: '1rem',
                overflow: 'hidden',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                  background: 'rgba(9,9,11,0.6)',
                }}
              >
                {/* Play button circle */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '2px solid #d4a846',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Triangle */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#d4a846"
                    style={{ marginLeft: '3px' }}
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.45)',
                    letterSpacing: '0.05em',
                  }}
                >
                  Platform walkthrough coming soon
                </span>
              </div>
            </a>
        </div>
      </section>

      {/* ═══════════════ LISTINGS PREVIEW ═══════════════ */}
      <section className="listings" id="listings">
        <div className="container">
          <div className="section-header">
              <span className="section-tag">Marketplace</span>
              <h2 className="section-title">
                Active <span className="text-gold">Listings</span>
              </h2>
            </div>

          {/* Filter bar (static preview) */}
          <div className="filter-bar glass-card">
            <div className="filter-bar__group">
              <label>Asset Type</label>
              <select defaultValue="">
                <option value="">All Types</option>
                <option>Residential</option>
                <option>Commercial</option>
                <option>Consumer</option>
                <option>Mixed</option>
              </select>
            </div>
            <div className="filter-bar__group">
              <label>UPB Range</label>
              <select defaultValue="">
                <option value="">Any</option>
                <option>$0 – $5M</option>
                <option>$5M – $25M</option>
                <option>$25M – $100M</option>
                <option>$100M+</option>
              </select>
            </div>
            <div className="filter-bar__group">
              <label>Location</label>
              <select defaultValue="">
                <option value="">All Regions</option>
                <option>Northeast</option>
                <option>Southeast</option>
                <option>Midwest</option>
                <option>West</option>
              </select>
            </div>
            <div className="filter-bar__group">
              <label>Status</label>
              <select defaultValue="">
                <option value="">All</option>
                <option>Active</option>
                <option>Under Review</option>
                <option>Pending</option>
              </select>
            </div>
            <Link href="/signup" className="btn btn--gold">
              Search Listings
            </Link>
          </div>

          <div className="listings__grid">
            {previewListings.map((listing) => {
              const t = ASSET_TYPE_LABEL[listing.assetType] ?? { label: listing.assetType, cls: 'residential' }
              return (
                <div key={listing.id} className="listing-card glass-card">
                  <div className="listing-card__header">
                    <span className={`listing-card__type listing-card__type--${t.cls}`}>
                      {t.label}
                    </span>
                    <span className="listing-card__status listing-card__status--active">
                      Active
                    </span>
                  </div>
                  <h3 className="listing-card__title">{listing.title}</h3>
                  <div className="listing-card__meta">
                    <div className="listing-card__meta-item">
                      <span className="listing-card__meta-label">UPB</span>
                      <span className="listing-card__meta-value">{formatCurrency(listing.unpaidBalance)}</span>
                    </div>
                    <div className="listing-card__meta-item">
                      <span className="listing-card__meta-label">Loans</span>
                      <span className="listing-card__meta-value">{listing.loanCount.toLocaleString()}</span>
                    </div>
                    <div className="listing-card__meta-item">
                      <span className="listing-card__meta-label">Location</span>
                      <span className="listing-card__meta-value">{listing.location}</span>
                    </div>
                    <div className="listing-card__meta-item">
                      <span className="listing-card__meta-label">Avg. Delinquency</span>
                      <span className="listing-card__meta-value">{formatDelinquency(listing.avgDelinquency)}</span>
                    </div>
                  </div>
                  <div className="listing-card__footer">
                    <span className="listing-card__date">Listed {timeAgo(listing.createdAt)}</span>
                    <Link href="/signup" className="btn btn--gold btn--sm">
                      View Details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ MESSAGING PREVIEW ═══════════════ */}
      <section className="messaging" id="messages">
        <div className="container">
          <div className="section-header">
              <span className="section-tag">Direct Messaging</span>
              <h2 className="section-title">
                Secure, <span className="text-gold">institutional‑grade</span> communication
              </h2>
            </div>
            <MessagingPreview />
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="cta">
        <div className="cta__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
        </div>
        <div className="container cta__inner">
          <span className="section-tag">Start Today</span>
            <h2 className="cta__title">
              Ready to unlock the value<br />in your distressed portfolio?
            </h2>
            <p className="cta__subtitle">
              Join the most trusted NPL marketplace. List your first asset in under 10 minutes.
            </p>
            <div className="cta__actions">
              <Link href="/signup" className="btn btn--gold btn--lg">
                Create Seller Account
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/signin" className="btn btn--glass btn--lg">
                Schedule a Demo
              </Link>
            </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <Link href="/" className="nav__logo">
                <span className="nav__logo-icon">◈</span>
                <span className="nav__logo-text">AURUM</span>
              </Link>
              <p className="footer__brand-desc">
                The institutional marketplace for non‑performing loan transactions.
              </p>
            </div>
            <div className="footer__col">
              <h4>Platform</h4>
              <Link href="/listings">Listings</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/messages">Messaging</Link>
            </div>
            <div className="footer__col">
              <h4>Company</h4>
              <Link href="#">About</Link>
              <Link href="#">Careers</Link>
              <Link href="#">Press</Link>
              <Link href="#">Contact</Link>
            </div>
            <div className="footer__col">
              <h4>Legal</h4>
              <Link href="#">Terms of Service</Link>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Compliance</Link>
            </div>
          </div>
          <div className="footer__bottom">
            <span>&copy; 2026 AURUM. All rights reserved.</span>
            <span>Institutional use only. Not an offer to sell securities.</span>
          </div>
        </div>
      </footer>
    </>
  )
}

// ─── Static data ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:
      'AURUM has transformed how we source and evaluate NPL portfolios. The level of deal transparency is unmatched in the market.',
    name: 'Michael R.',
    title: 'Managing Director',
    company: 'Atlas Capital Partners',
  },
  {
    quote:
      'The due diligence tools and secure data room have cut our underwriting time in half. This is the future of distressed debt trading.',
    name: 'Sarah L.',
    title: 'Portfolio Manager',
    company: 'Meridian Fund',
  },
  {
    quote:
      'Finally, a platform built specifically for NPL professionals. The yield calculator alone has saved us countless hours.',
    name: 'James K.',
    title: 'Principal',
    company: 'Summit NPL Advisors',
  },
]


