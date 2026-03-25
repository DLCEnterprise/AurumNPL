-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SELLER', 'BUYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'PENDING', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'CONSUMER', 'MIXED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'SELLER',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastName" TEXT,
    "entityName" TEXT,
    "signerTitle" TEXT,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "directPhone" TEXT,
    "officePhone" TEXT,
    "yearsExperience" INTEGER,
    "investorType" TEXT,
    "lienPosition" TEXT,
    "loanStatusPref" TEXT,
    "mainObjective" TEXT,
    "servicerName" TEXT,
    "servicerAddress" TEXT,
    "servicerContactName" TEXT,
    "servicerContactPhone" TEXT,
    "servicerContactEmail" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assetType" "AssetType" NOT NULL,
    "unpaidBalance" DOUBLE PRECISION NOT NULL,
    "loanCount" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "region" TEXT,
    "avgDelinquency" INTEGER,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "documents" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sellerId" TEXT NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "ltv" DOUBLE PRECISION,
    "cltv" DOUBLE PRECISION,
    "payoffCltv" DOUBLE PRECISION,
    "fairMarketValue" DOUBLE PRECISION,
    "occupancyType" TEXT,
    "homePurchaseDate" TIMESTAMP(3),
    "homePurchasePrice" DOUBLE PRECISION,
    "propertyStreet" TEXT,
    "propertyCity" TEXT,
    "propertyState" TEXT,
    "propertyZip" TEXT,
    "streetViewUrl" TEXT,
    "isInBankruptcy" BOOLEAN,
    "bankruptcyChapter" TEXT,
    "bkFilingDate" TIMESTAMP(3),
    "ch13PocFilingDate" TIMESTAMP(3),
    "bkConfirmationDate" TIMESTAMP(3),
    "bkDismissalDate" TIMESTAMP(3),
    "ch13DischargedDate" TIMESTAMP(3),
    "ch7PetitionDate" TIMESTAMP(3),
    "ch7CaseNumber" TEXT,
    "ch7DateFiled" TIMESTAMP(3),
    "ch7DismissalDate" TIMESTAMP(3),
    "ch7DischargeDate" TIMESTAMP(3),
    "prevCh13PetitionDate" TIMESTAMP(3),
    "prevCh13CaseNumber" TEXT,
    "prevCh13DateFiled" TIMESTAMP(3),
    "prevCh13DismissalDate" TIMESTAMP(3),
    "prevCh13DischargeDate" TIMESTAMP(3),
    "firstMtg_loanStatus" TEXT,
    "firstMtg_originationDate" TIMESTAMP(3),
    "firstMtg_maturityDate" TIMESTAMP(3),
    "firstMtg_loanTermMonths" INTEGER,
    "firstMtg_firstPaymentDate" TIMESTAMP(3),
    "firstMtg_interestPaidToDate" TIMESTAMP(3),
    "firstMtg_totalMonthsPaid" INTEGER,
    "firstMtg_originalAmount" DOUBLE PRECISION,
    "firstMtg_currentBalance" DOUBLE PRECISION,
    "firstMtg_nextDueDate" TIMESTAMP(3),
    "firstMtg_monthsRemaining" INTEGER,
    "firstMtg_interestRate" DOUBLE PRECISION,
    "firstMtg_monthlyPI" DOUBLE PRECISION,
    "firstMtg_monthlyEscrow" DOUBLE PRECISION,
    "firstMtg_isModified" BOOLEAN,
    "firstMtg_hasBalloon" BOOLEAN,
    "firstMtg_balloonDate" TIMESTAMP(3),
    "firstMtg_modDate" TIMESTAMP(3),
    "firstMtg_modMaturityDate" TIMESTAMP(3),
    "firstMtg_modTermMonths" INTEGER,
    "firstMtg_modFirstPayDate" TIMESTAMP(3),
    "firstMtg_modInterestPaidTo" TIMESTAMP(3),
    "firstMtg_modMonthsPaid" INTEGER,
    "firstMtg_modPaymentsRemaining" INTEGER,
    "firstMtg_modLoanAmount" DOUBLE PRECISION,
    "firstMtg_modCurrentBalance" DOUBLE PRECISION,
    "firstMtg_modDeferredBalance" DOUBLE PRECISION,
    "firstMtg_modInterestRate" DOUBLE PRECISION,
    "firstMtg_modMonthlyPI" DOUBLE PRECISION,
    "firstMtg_modMonthlyEscrow" DOUBLE PRECISION,
    "firstMtg_foreclosureDefaultDate" TIMESTAMP(3),
    "firstMtg_foreclosureDefaultAmt" DOUBLE PRECISION,
    "firstMtg_foreclosureSaleDate" TIMESTAMP(3),
    "secondMtg_loanStatus" TEXT,
    "secondMtg_originationDate" TIMESTAMP(3),
    "secondMtg_maturityDate" TIMESTAMP(3),
    "secondMtg_loanTermMonths" INTEGER,
    "secondMtg_firstPaymentDate" TIMESTAMP(3),
    "secondMtg_interestPaidToDate" TIMESTAMP(3),
    "secondMtg_totalMonthsPaid" INTEGER,
    "secondMtg_originalAmount" DOUBLE PRECISION,
    "secondMtg_currentBalance" DOUBLE PRECISION,
    "secondMtg_nextDueDate" TIMESTAMP(3),
    "secondMtg_monthsRemaining" INTEGER,
    "secondMtg_interestRate" DOUBLE PRECISION,
    "secondMtg_monthlyPI" DOUBLE PRECISION,
    "secondMtg_monthlyEscrow" DOUBLE PRECISION,
    "secondMtg_isModified" BOOLEAN,
    "secondMtg_hasBalloon" BOOLEAN,
    "secondMtg_balloonDate" TIMESTAMP(3),
    "secondMtg_modDate" TIMESTAMP(3),
    "secondMtg_modMaturityDate" TIMESTAMP(3),
    "secondMtg_modTermMonths" INTEGER,
    "secondMtg_modFirstPayDate" TIMESTAMP(3),
    "secondMtg_modInterestPaidTo" TIMESTAMP(3),
    "secondMtg_modMonthsPaid" INTEGER,
    "secondMtg_modPaymentsRemaining" INTEGER,
    "secondMtg_modLoanAmount" DOUBLE PRECISION,
    "secondMtg_modCurrentBalance" DOUBLE PRECISION,
    "secondMtg_modDeferredBalance" DOUBLE PRECISION,
    "secondMtg_modInterestRate" DOUBLE PRECISION,
    "secondMtg_modMonthlyPI" DOUBLE PRECISION,
    "secondMtg_modMonthlyEscrow" DOUBLE PRECISION,
    "secondMtg_foreclosureDefaultDate" TIMESTAMP(3),
    "secondMtg_foreclosureDefaultAmt" DOUBLE PRECISION,
    "secondMtg_foreclosureSaleDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "conversationId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_approvalStatus_idx" ON "User"("approvalStatus");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_assetType_idx" ON "Listing"("assetType");

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_listingId_key" ON "Asset"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_userId_conversationId_key" ON "ConversationParticipant"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminToken_token_key" ON "AdminToken"("token");

-- CreateIndex
CREATE INDEX "AdminToken_token_idx" ON "AdminToken"("token");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
