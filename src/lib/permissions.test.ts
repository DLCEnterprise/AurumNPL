import { describe, it, expect } from 'vitest'
import { can } from './permissions'
import type { SessionUser } from '@/types'

const approvedBuyer: SessionUser = {
  id: 'buyer-1',
  email: 'buyer@test.com',
  role: 'BUYER',
  approvalStatus: 'APPROVED',
}

const approvedSeller: SessionUser = {
  id: 'seller-1',
  email: 'seller@test.com',
  role: 'SELLER',
  approvalStatus: 'APPROVED',
}

const pendingBuyer: SessionUser = {
  id: 'pending-1',
  email: 'pending@test.com',
  role: 'BUYER',
  approvalStatus: 'PENDING',
}

const rejectedSeller: SessionUser = {
  id: 'rejected-1',
  email: 'rejected@test.com',
  role: 'SELLER',
  approvalStatus: 'REJECTED',
}

const admin: SessionUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  role: 'ADMIN',
  approvalStatus: 'APPROVED',
}

const ownedListing = { sellerId: 'seller-1' }
const otherListing = { sellerId: 'seller-99' }

describe('can.viewMarketplace', () => {
  it('allows approved buyers', () => expect(can.viewMarketplace(approvedBuyer)).toBe(true))
  it('allows approved sellers', () => expect(can.viewMarketplace(approvedSeller)).toBe(true))
  it('allows admins', () => expect(can.viewMarketplace(admin)).toBe(true))
  it('blocks pending users', () => expect(can.viewMarketplace(pendingBuyer)).toBe(false))
  it('blocks rejected users', () => expect(can.viewMarketplace(rejectedSeller)).toBe(false))
})

describe('can.createListing', () => {
  it('allows approved sellers', () => expect(can.createListing(approvedSeller)).toBe(true))
  it('blocks buyers', () => expect(can.createListing(approvedBuyer)).toBe(false))
  it('blocks pending sellers', () => expect(can.createListing({ ...approvedSeller, approvalStatus: 'PENDING' })).toBe(false))
})

describe('can.manageListing', () => {
  it('allows seller to manage own listing', () => expect(can.manageListing(approvedSeller, ownedListing)).toBe(true))
  it('blocks seller from managing other listings', () => expect(can.manageListing(approvedSeller, otherListing)).toBe(false))
  it('allows admin to manage any listing', () => expect(can.manageListing(admin, otherListing)).toBe(true))
  it('blocks buyer from managing any listing', () => expect(can.manageListing(approvedBuyer, ownedListing)).toBe(false))
})

describe('can.placeBid', () => {
  it('allows approved buyers', () => expect(can.placeBid(approvedBuyer)).toBe(true))
  it('blocks sellers', () => expect(can.placeBid(approvedSeller)).toBe(false))
  it('blocks pending buyers', () => expect(can.placeBid(pendingBuyer)).toBe(false))
})

describe('can.viewBids', () => {
  it('allows listing owner to view bids', () => expect(can.viewBids(approvedSeller, ownedListing)).toBe(true))
  it('blocks seller from viewing bids on other listings', () => expect(can.viewBids(approvedSeller, otherListing)).toBe(false))
  it('allows admin to view all bids', () => expect(can.viewBids(admin, otherListing)).toBe(true))
  it('blocks buyers from viewing bids', () => expect(can.viewBids(approvedBuyer, ownedListing)).toBe(false))
})

describe('can.signNda', () => {
  it('allows approved buyers', () => expect(can.signNda(approvedBuyer)).toBe(true))
  it('blocks sellers', () => expect(can.signNda(approvedSeller)).toBe(false))
  it('blocks unapproved buyers', () => expect(can.signNda(pendingBuyer)).toBe(false))
})

describe('can.accessAdmin', () => {
  it('allows admins', () => expect(can.accessAdmin(admin)).toBe(true))
  it('blocks buyers', () => expect(can.accessAdmin(approvedBuyer)).toBe(false))
  it('blocks sellers', () => expect(can.accessAdmin(approvedSeller)).toBe(false))
})
