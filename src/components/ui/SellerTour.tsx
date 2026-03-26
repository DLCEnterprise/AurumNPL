'use client'
import { OnboardingTour } from './OnboardingTour'

const SELLER_STEPS = [
  { target: '.nav__logo', title: 'Welcome to AURUM', description: 'AURUM is a professional marketplace for non-performing loan portfolios. Let us show you around.', position: 'right' as const },
  { target: '[href="/listings/new"], [href="/listings/import"]', title: 'Create Your First Listing', description: 'Upload an Excel tape or enter data manually to list your NPL portfolio on the marketplace.', position: 'right' as const },
  { target: '[href="/listings"]', title: 'Manage Listings', description: 'View all your listings, track performance, and respond to bids from qualified buyers.', position: 'right' as const },
  { target: '[href="/messages"]', title: 'Messages', description: 'Communicate directly with interested buyers through our secure messaging system.', position: 'right' as const },
  { target: '[href="/profile"]', title: 'Your Profile', description: 'Complete your profile to build credibility with buyers and set notification preferences.', position: 'right' as const },
]

export function SellerTour() {
  return <OnboardingTour steps={SELLER_STEPS} tourKey="seller" />
}
