import type { SessionUser } from '@/types'

type MinimalListing = { sellerId: string }

function isApproved(user: SessionUser): boolean {
  return user.approvalStatus === 'APPROVED'
}

export const can = {
  viewMarketplace: (user: SessionUser) =>
    isApproved(user),

  createListing: (user: SessionUser) =>
    isApproved(user) && user.role === 'SELLER',

  manageListing: (user: SessionUser, listing: MinimalListing) =>
    isApproved(user) &&
    (user.role === 'ADMIN' || (user.role === 'SELLER' && listing.sellerId === user.id)),

  placeBid: (user: SessionUser) =>
    isApproved(user) && user.role === 'BUYER',

  viewBids: (user: SessionUser, listing: MinimalListing) =>
    isApproved(user) &&
    (user.role === 'ADMIN' || listing.sellerId === user.id),

  signNda: (user: SessionUser) =>
    isApproved(user) && user.role === 'BUYER',

  accessAdmin: (user: SessionUser) =>
    user.role === 'ADMIN',
} as const
