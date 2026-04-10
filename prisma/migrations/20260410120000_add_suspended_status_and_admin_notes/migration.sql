-- Add SUSPENDED value to ApprovalStatus enum
-- IF NOT EXISTS requires PostgreSQL 9.3+ (Neon uses PG 16 — safe)
ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- Add admin-only fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT;
