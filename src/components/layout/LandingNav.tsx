'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => {
    setMenuOpen(false)
    document.body.style.overflow = ''
  }

  const toggleMenu = () => {
    const next = !menuOpen
    setMenuOpen(next)
    document.body.style.overflow = next ? 'hidden' : ''
  }

  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    closeMenu()
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
        <div className="nav__inner">
          <Link href="/" className="nav__logo">
            <span className="nav__logo-icon">◈</span>
            <span className="nav__logo-text">AURUM</span>
          </Link>

          <ul className="nav__links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="nav__link"
                  onClick={(e) => handleAnchor(e, link.href)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="nav__actions">
            <ThemeToggle />
            <Link href="/signin" className="btn btn--ghost">Sign In</Link>
            <Link href="/signup" className="btn btn--gold">Get Started</Link>
          </div>

          <button
            className={`nav__hamburger${menuOpen ? ' open' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className="mobile-menu__inner">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mobile-menu__link"
              onClick={(e) => handleAnchor(e, link.href)}
            >
              {link.label}
            </a>
          ))}
          <div className="mobile-menu__actions">
            <Link href="/signin" className="btn btn--ghost btn--full" onClick={closeMenu}>
              Sign In
            </Link>
            <Link href="/signup" className="btn btn--gold btn--full" onClick={closeMenu}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#listings', label: 'Listings' },
  { href: '#messages', label: 'Messages' },
  { href: '#features', label: 'Features' },
]
