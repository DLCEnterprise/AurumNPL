import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingNav } from '@/components/layout/LandingNav'
import { MessagingPreview } from '@/components/messaging/MessagingPreview'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export const metadata: Metadata = {
  title: 'AURUM — Where Distressed Assets Find New Value',
}

export default function HomePage() {
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
            <div className="hero__stat">
              <span className="hero__stat-value">$2.4B</span>
              <span className="hero__stat-label">Assets Listed</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-value">340+</span>
              <span className="hero__stat-label">Active Sellers</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-value">98.7%</span>
              <span className="hero__stat-label">Success Rate</span>
            </div>
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
            <ScrollReveal className="about__card glass-card">
              <div className="about__card-number">01</div>
              <h3>List</h3>
              <p>
                Upload your non‑performing loan portfolios with detailed data — asset type,
                UPB, geography, and status — in a structured, institutional format.
              </p>
            </ScrollReveal>
            <ScrollReveal className="about__card glass-card" delay={0.1}>
              <div className="about__card-number">02</div>
              <h3>Connect</h3>
              <p>
                Receive expressions of interest from vetted, qualified buyers. Communicate
                directly through our encrypted messaging system.
              </p>
            </ScrollReveal>
            <ScrollReveal className="about__card glass-card" delay={0.2}>
              <div className="about__card-number">03</div>
              <h3>Transact</h3>
              <p>
                Negotiate terms, share due diligence materials, and close deals — all within
                a single, secure, auditable environment.
              </p>
            </ScrollReveal>
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
            <ScrollReveal className="feature-card">
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
            </ScrollReveal>
            <ScrollReveal className="feature-card" delay={0.08}>
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
            </ScrollReveal>
            <ScrollReveal className="feature-card" delay={0.16}>
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
            </ScrollReveal>
            <ScrollReveal className="feature-card" delay={0.24}>
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
            </ScrollReveal>
          </div>
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
          <ScrollReveal className="filter-bar glass-card">
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
          </ScrollReveal>

          <div className="listings__grid">
            {SAMPLE_LISTINGS.map((listing, i) => (
              <ScrollReveal
                key={listing.id}
                className="listing-card glass-card"
                delay={i * 0.08}
              >
                <div className="listing-card__header">
                  <span className={`listing-card__type listing-card__type--${listing.typeClass}`}>
                    {listing.type}
                  </span>
                  <span className={`listing-card__status listing-card__status--${listing.statusClass}`}>
                    {listing.status}
                  </span>
                </div>
                <h3 className="listing-card__title">{listing.title}</h3>
                <div className="listing-card__meta">
                  <div className="listing-card__meta-item">
                    <span className="listing-card__meta-label">UPB</span>
                    <span className="listing-card__meta-value">{listing.upb}</span>
                  </div>
                  <div className="listing-card__meta-item">
                    <span className="listing-card__meta-label">Loans</span>
                    <span className="listing-card__meta-value">{listing.loans}</span>
                  </div>
                  <div className="listing-card__meta-item">
                    <span className="listing-card__meta-label">Location</span>
                    <span className="listing-card__meta-value">{listing.location}</span>
                  </div>
                  <div className="listing-card__meta-item">
                    <span className="listing-card__meta-label">Avg. Delinquency</span>
                    <span className="listing-card__meta-value">{listing.delinquency}</span>
                  </div>
                </div>
                <div className="listing-card__footer">
                  <span className="listing-card__date">{listing.date}</span>
                  <Link href="/signup" className="btn btn--gold btn--sm">
                    View Details
                  </Link>
                </div>
              </ScrollReveal>
            ))}
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
          <ScrollReveal>
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
          </ScrollReveal>
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

// ─── Sample listing data ─────────────────────────────────────────────────────

const SAMPLE_LISTINGS = [
  {
    id: '1',
    type: 'Residential',
    typeClass: 'residential',
    status: 'Active',
    statusClass: 'active',
    title: 'Southeast Residential NPL Portfolio',
    upb: '$18.4M',
    loans: '127',
    location: 'FL, GA, SC',
    delinquency: '18 months',
    date: 'Listed 3 days ago',
  },
  {
    id: '2',
    type: 'Commercial',
    typeClass: 'commercial',
    status: 'Under Review',
    statusClass: 'review',
    title: 'Midwest CRE Distressed Notes',
    upb: '$48.7M',
    loans: '34',
    location: 'OH, MI, IN',
    delinquency: '24 months',
    date: 'Listed 1 week ago',
  },
  {
    id: '3',
    type: 'Consumer',
    typeClass: 'consumer',
    status: 'Active',
    statusClass: 'active',
    title: 'Auto Loan Charge‑Off Pool',
    upb: '$6.1M',
    loans: '842',
    location: 'Nationwide',
    delinquency: '12 months',
    date: 'Listed 2 days ago',
  },
  {
    id: '4',
    type: 'Mixed',
    typeClass: 'mixed',
    status: 'Pending',
    statusClass: 'pending',
    title: 'Northeast Mixed‑Use NPL Tape',
    upb: '$92.3M',
    loans: '215',
    location: 'NY, NJ, CT',
    delinquency: '9 months',
    date: 'Listed 5 days ago',
  },
]
