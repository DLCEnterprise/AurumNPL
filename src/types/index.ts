import type {
  User,
  Listing,
  Conversation,
  Message,
  UserRole,
  ApprovalStatus,
  ListingStatus,
  AssetType,
} from '@prisma/client'

// Re-export Prisma enums for convenience
export type { UserRole, ApprovalStatus, ListingStatus, AssetType }

// ─── Serialized types (safe for client components) ──────────────────────────

export type SerializedUser = Omit<User, 'passwordHash' | 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

export type SerializedListing = Omit<Listing, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  seller?: Pick<User, 'id' | 'name' | 'company'>
}

export type SerializedMessage = Omit<Message, 'createdAt' | 'readAt'> & {
  createdAt: string
  readAt: string | null
  sender?: Pick<User, 'id' | 'name' | 'company'>
}

export type SerializedConversation = Omit<Conversation, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  otherParticipant?: Pick<User, 'id' | 'name' | 'company'>
  lastMessage?: SerializedMessage
  unreadCount?: number
}

// ─── API response shapes ─────────────────────────────────────────────────────

export interface ApiSuccess<T = void> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  fieldErrors?: Record<string, string[]>
}

export type ApiResponse<T = void> = ApiSuccess<T> | ApiError

// ─── Form input types ────────────────────────────────────────────────────────

export interface SignUpInput {
  name: string
  email: string
  password: string
  confirmPassword: string
  company: string
  phone?: string
  role: 'SELLER' | 'BUYER'
  terms: boolean
}

export interface SignInInput {
  email: string
  password: string
}

export interface CreateListingInput {
  title: string
  description?: string
  assetType: AssetType
  unpaidBalance: number
  loanCount: number
  location: string
  region?: string
  avgDelinquency?: number
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  status?: ListingStatus
}

export interface SendMessageInput {
  content: string
}

export interface UpdateProfileInput {
  name?: string
  company?: string
  phone?: string
}

// ─── Listing filter params ───────────────────────────────────────────────────

export interface ListingFilters {
  assetType?: AssetType
  status?: ListingStatus
  region?: string
  upbMin?: number
  upbMax?: number
  page?: number
  limit?: number
  mine?: boolean
}

// ─── Session user (subset of full User) ─────────────────────────────────────

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  role: UserRole
  approvalStatus: ApprovalStatus
  company?: string | null
}

// ─── Audit actions — exhaustive enum for type-safe audit logging ─────────────

export const AuditAction = {
  // Auth
  USER_SIGNUP:           'USER_SIGNUP',
  USER_SIGNIN:           'USER_SIGNIN',
  USER_SIGNOUT:          'USER_SIGNOUT',
  PASSWORD_RESET_REQ:    'PASSWORD_RESET_REQ',
  PASSWORD_RESET_DONE:   'PASSWORD_RESET_DONE',
  // Admin
  USER_APPROVED:         'USER_APPROVED',
  USER_REJECTED:         'USER_REJECTED',
  USER_SUSPENDED:        'USER_SUSPENDED',
  ROLE_CHANGED:          'ROLE_CHANGED',
  // Listings
  LISTING_CREATED:       'LISTING_CREATED',
  LISTING_UPDATED:       'LISTING_UPDATED',
  LISTING_PUBLISHED:     'LISTING_PUBLISHED',
  LISTING_ARCHIVED:      'LISTING_ARCHIVED',
  LISTING_DELETED:       'LISTING_DELETED',
  // Bids
  BID_PLACED:            'BID_PLACED',
  BID_ACCEPTED:          'BID_ACCEPTED',
  BID_DECLINED:          'BID_DECLINED',
  BID_WITHDRAWN:         'BID_WITHDRAWN',
  // NDA
  NDA_SIGNED:            'NDA_SIGNED',
  // Documents
  DOCUMENT_UPLOADED:     'DOCUMENT_UPLOADED',
  DOCUMENT_DOWNLOADED:   'DOCUMENT_DOWNLOADED',
  DOCUMENT_DELETED:      'DOCUMENT_DELETED',
} as const

export type AuditAction = typeof AuditAction[keyof typeof AuditAction]
