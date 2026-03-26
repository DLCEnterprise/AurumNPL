'use client'
import { OnboardingTour } from './OnboardingTour'

const BUYER_STEPS = [
  { target: '.nav__logo', title: 'Welcome to AURUM', description: 'AURUM is a professional marketplace for non-performing loan portfolios. Let us show you around.', position: 'right' as const },
  { target: '[href="/listings"]', title: 'Browse Listings', description: 'Discover NPL portfolios from verified sellers. Filter by asset type, UPB, lien position, and more.', position: 'right' as const },
  { target: '[href="/watchlist"]', title: 'Watchlist', description: 'Save listings you\'re interested in to your watchlist for quick access.', position: 'right' as const },
  { target: '[href="/pipeline"]', title: 'Deal Pipeline', description: 'Track deals you\'re actively pursuing through your personal Kanban board.', position: 'right' as const },
  { target: '[href="/messages"]', title: 'Messages', description: 'Communicate directly with sellers and negotiate deals through our secure messaging system.', position: 'right' as const },
  { target: '[href="/profile"]', title: 'Your Profile', description: 'Complete your investor profile to build credibility with sellers and set notification preferences.', position: 'right' as const },
]

export function BuyerTour() {
  return <OnboardingTour steps={BUYER_STEPS} tourKey="buyer" />
}
