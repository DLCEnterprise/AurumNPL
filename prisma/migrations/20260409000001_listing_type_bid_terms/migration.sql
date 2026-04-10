-- Add listing type and deal term fields to Listing
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "listingType" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bidDeadline" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "reservePrice" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "preferredClosingDays" INTEGER;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "ndaRequired" BOOLEAN;
