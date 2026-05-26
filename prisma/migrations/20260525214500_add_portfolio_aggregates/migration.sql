-- Portfolio-aggregate columns on Listing.
-- All nullable; older listings and single-asset notes don't need them.
ALTER TABLE "Listing"
  ADD COLUMN "originalUpb"        DOUBLE PRECISION,
  ADD COLUMN "avgInterestRate"    DOUBLE PRECISION,
  ADD COLUMN "avgLTV"             DOUBLE PRECISION,
  ADD COLUMN "avgCLTV"            DOUBLE PRECISION,
  ADD COLUMN "propertyMix"        TEXT,
  ADD COLUMN "stateConcentration" TEXT,
  ADD COLUMN "pctNonPerforming"   DOUBLE PRECISION,
  ADD COLUMN "pctPerforming"      DOUBLE PRECISION;
