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
