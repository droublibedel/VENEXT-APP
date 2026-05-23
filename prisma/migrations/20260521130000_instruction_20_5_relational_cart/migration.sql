-- Instruction 20.5 / 20.5A — relational cart (corridor-scoped preparation, not public checkout).
-- Requires "CommercialCorridorState" enum (Instruction 20.4 migration).

CREATE TYPE "RelationalCartSourceType" AS ENUM (
  'NEGOTIATION_ACCEPTED',
  'CONVERSATIONAL_DRAFT_CONFIRMED',
  'SPONSORED_PRINCIPLE_AGREEMENT',
  'MANUAL_RELATIONAL_ENTRY',
  'RELATIONAL_REORDER'
);

CREATE TYPE "RelationalCartStatus" AS ENUM (
  'DRAFT',
  'READY_FOR_REVIEW',
  'CONFIRMED_BY_BUYER',
  'CONFIRMED_BY_SELLER',
  'CONFIRMED_BY_BOTH_PARTIES',
  'LOCKED_FOR_ORDER',
  'CONVERTED_TO_ORDER',
  'REJECTED',
  'EXPIRED'
);

CREATE TYPE "RelationalCartLineValidationStatus" AS ENUM (
  'VALIDATED',
  'PRODUCT_UNAVAILABLE',
  'QUANTITY_REQUIRES_REVIEW',
  'CATALOG_VISIBILITY_REQUIRES_REVIEW',
  'SYMBOLIC_STOCK_ONLY',
  'REJECTED'
);

CREATE TABLE "relational_carts" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "buyerOrganizationId" UUID NOT NULL,
  "sellerOrganizationId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "negotiationId" UUID,
  "threadId" UUID,
  "sourceType" "RelationalCartSourceType" NOT NULL,
  "status" "RelationalCartStatus" NOT NULL DEFAULT 'DRAFT',
  "corridorStateAtCreation" "CommercialCorridorState" NOT NULL,
  "corridorGovernanceValidated" BOOLEAN NOT NULL DEFAULT false,
  "corridorOperationalWarnings" JSONB NOT NULL DEFAULT '[]',
  "corridorPolicySource" TEXT NOT NULL DEFAULT 'RelationshipGovernancePolicyService.assertCorridorOperational',
  "commercialTrustBand" TEXT,
  "requiresBuyerSellerConfirmation" BOOLEAN NOT NULL DEFAULT false,
  "conversionBlockedReason" TEXT,
  "cartConvertibleToOrder" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" UUID NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "convertedOrderId" UUID,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_carts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_carts_convertedOrderId_key" ON "relational_carts"("convertedOrderId");

CREATE INDEX "relational_carts_relationshipId_status_idx" ON "relational_carts"("relationshipId", "status");
CREATE INDEX "relational_carts_buyerOrganizationId_updatedAt_idx" ON "relational_carts"("buyerOrganizationId", "updatedAt");
CREATE INDEX "relational_carts_sellerOrganizationId_updatedAt_idx" ON "relational_carts"("sellerOrganizationId", "updatedAt");
CREATE INDEX "relational_carts_negotiationId_idx" ON "relational_carts"("negotiationId");
CREATE INDEX "relational_carts_threadId_idx" ON "relational_carts"("threadId");

ALTER TABLE "relational_carts" ADD CONSTRAINT "relational_carts_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_carts" ADD CONSTRAINT "relational_carts_buyerOrganizationId_fkey"
  FOREIGN KEY ("buyerOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_carts" ADD CONSTRAINT "relational_carts_sellerOrganizationId_fkey"
  FOREIGN KEY ("sellerOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_carts" ADD CONSTRAINT "relational_carts_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "relational_carts" ADD CONSTRAINT "relational_carts_negotiationId_fkey"
  FOREIGN KEY ("negotiationId") REFERENCES "negotiations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_carts" ADD CONSTRAINT "relational_carts_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_carts" ADD CONSTRAINT "relational_carts_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "relational_carts" ADD CONSTRAINT "relational_carts_convertedOrderId_fkey"
  FOREIGN KEY ("convertedOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "relational_cart_items" (
  "id" UUID NOT NULL,
  "cartId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "catalogId" UUID,
  "quantity" DECIMAL(18,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "symbolicStockStatus" TEXT NOT NULL,
  "sourceMessageId" UUID,
  "sourceNegotiationId" UUID,
  "sourceDraftRevisionId" TEXT,
  "lineValidationStatus" "RelationalCartLineValidationStatus" NOT NULL DEFAULT 'VALIDATED',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_cart_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_cart_items_cartId_idx" ON "relational_cart_items"("cartId");
CREATE INDEX "relational_cart_items_productId_idx" ON "relational_cart_items"("productId");

ALTER TABLE "relational_cart_items" ADD CONSTRAINT "relational_cart_items_cartId_fkey"
  FOREIGN KEY ("cartId") REFERENCES "relational_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_cart_items" ADD CONSTRAINT "relational_cart_items_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
