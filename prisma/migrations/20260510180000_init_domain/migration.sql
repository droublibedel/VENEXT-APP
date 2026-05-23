-- CreateEnum
CREATE TYPE "PreferredLanguage" AS ENUM ('fr', 'en', 'ar', 'zh');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "OrganizationActorType" AS ENUM ('INDUSTRIAL_PRODUCER', 'WHOLESALER', 'RETAILER', 'BACKOFFICE');

-- CreateEnum
CREATE TYPE "OrganizationCategory" AS ENUM ('PRODUCER', 'WHOLESALER_A', 'WHOLESALER_B', 'RETAILER', 'INTERNAL_ADMIN');

-- CreateEnum
CREATE TYPE "OrganizationVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrgMemberRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "OrgMemberPole" AS ENUM ('DIRECTION_STRATEGY', 'COMMERCIAL_NETWORK', 'MARKETING_ACTIVATION', 'ORDERS_ADV', 'SUPPLY_LOGISTICS', 'FINANCE_COLLECTIONS', 'DATA_INTELLIGENCE', 'INDUSTRIAL_SAFETY');

-- CreateEnum
CREATE TYPE "OrgMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RelationshipSource" AS ENUM ('PHONE_CONTACT', 'NETWORK_CODE', 'MANUAL_INVITATION', 'SPONSORED_DISCOVERY', 'BACKOFFICE_CREATED');

-- CreateEnum
CREATE TYPE "ContactSuggestionReason" AS ENUM ('mutual_phone_contact', 'network_code', 'same_commercial_zone', 'repeated_transaction_signal');

-- CreateEnum
CREATE TYPE "ContactSuggestionSource" AS ENUM ('CONTACT_SYNC', 'GRAPH_INFERENCE', 'OPERATOR');

-- CreateEnum
CREATE TYPE "ContactSuggestionStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTED_ON');

-- CreateEnum
CREATE TYPE "CatalogType" AS ENUM ('UPSTREAM_ACCESS', 'DOWNSTREAM_OWN_CATALOG');

-- CreateEnum
CREATE TYPE "CatalogVisibilityMode" AS ENUM ('RELATIONSHIP_ONLY', 'SPONSORED_ALLOWED', 'INTERNAL_ONLY');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'HIDDEN');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'PAY_ON_DELIVERY', 'ELECTRONIC_REQUIRED', 'ELECTRONIC_OPTIONAL', 'CREDIT_ALLOWED');

-- CreateEnum
CREATE TYPE "QualityBadge" AS ENUM ('premium_badge', 'verified_supplier', 'certified_product', 'traceability_ready');

-- CreateEnum
CREATE TYPE "ProductVisibilityType" AS ENUM ('RELATIONSHIP_DEFAULT', 'SPONSORED_INJECTION', 'PRIVATE_PROMO', 'GROUP_BUYING');

-- CreateEnum
CREATE TYPE "OrderDirection" AS ENUM ('UPSTREAM_PURCHASE', 'DOWNSTREAM_CLIENT_ORDER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CREDIT', 'PAY_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('NOT_STARTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('OPEN', 'PROPOSED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_CART');

-- CreateEnum
CREATE TYPE "ThreadType" AS ENUM ('PRODUCT_CONTEXT', 'ORDER_CONTEXT', 'DELIVERY_CONTEXT', 'PAYMENT_CONTEXT', 'GENERAL_BUSINESS');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'VOICE', 'IMAGE', 'VIDEO', 'SYSTEM_EVENT', 'PRICE_PROPOSAL', 'QUANTITY_PROPOSAL', 'ACCEPTANCE_EVENT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'TRANSFER', 'PAYMENT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'POSTED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "FeatureFlagScopeType" AS ENUM ('GLOBAL', 'COUNTRY', 'REGION', 'ORGANIZATION', 'ROLE');

-- CreateEnum
CREATE TYPE "EconomicSignalType" AS ENUM ('PRODUCT_VIEW', 'ACTIVE_DISCUSSION', 'ORDER_FREQUENCY_INCREASE', 'DEMAND_RISE', 'STOCK_TENSION', 'NEGOTIATION_ACTIVITY', 'PAYMENT_BEHAVIOR', 'RELATIONSHIP_GROWTH');

-- CreateEnum
CREATE TYPE "EconomicSignalSource" AS ENUM ('CATALOG', 'ORDER', 'MESSAGE', 'WALLET', 'LOGISTICS', 'EXTERNAL_CONTEXT');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "preferredLanguage" "PreferredLanguage" NOT NULL DEFAULT 'en',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "activityLabel" TEXT NOT NULL,
    "actorType" "OrganizationActorType" NOT NULL,
    "category" "OrganizationCategory" NOT NULL,
    "profileImageUrl" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "commune" TEXT,
    "address" TEXT,
    "verificationStatus" "OrganizationVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "credibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "OrgMemberRole" NOT NULL,
    "pole" "OrgMemberPole",
    "status" "OrgMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" UUID NOT NULL,
    "requesterOrganizationId" UUID NOT NULL,
    "receiverOrganizationId" UUID NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'PENDING',
    "source" "RelationshipSource" NOT NULL,
    "upstreamOrganizationId" UUID NOT NULL,
    "downstreamOrganizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_suggestions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "suggestedOrganizationId" UUID NOT NULL,
    "reason" "ContactSuggestionReason" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "source" "ContactSuggestionSource" NOT NULL,
    "status" "ContactSuggestionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_codes" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "network_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "catalogType" "CatalogType" NOT NULL,
    "visibilityMode" "CatalogVisibilityMode" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "catalogId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unitLabel" TEXT NOT NULL,
    "basePrice" DECIMAL(18,4),
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "stockQuantity" DECIMAL(18,4),
    "paymentModes" "PaymentMode"[],
    "qualityBadges" "QualityBadge"[],
    "sponsorEligible" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_visibility" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "visibleToOrganizationId" UUID,
    "visibleToRelationshipId" UUID,
    "visibilityType" "ProductVisibilityType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "product_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "buyerOrganizationId" UUID NOT NULL,
    "sellerOrganizationId" UUID NOT NULL,
    "relationshipId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDirection" "OrderDirection" NOT NULL,
    "totalAmount" DECIMAL(24,6) NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "negotiatedPrice" DECIMAL(18,4),
    "subtotal" DECIMAL(24,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiations" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "buyerOrganizationId" UUID NOT NULL,
    "sellerOrganizationId" UUID NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'OPEN',
    "proposedQuantity" DECIMAL(18,4),
    "proposedPrice" DECIMAL(18,4),
    "acceptedQuantity" DECIMAL(18,4),
    "acceptedPrice" DECIMAL(18,4),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" UUID NOT NULL,
    "threadType" "ThreadType" NOT NULL,
    "productId" UUID,
    "orderId" UUID,
    "negotiationId" UUID,
    "buyerOrganizationId" UUID,
    "sellerOrganizationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "senderOrganizationId" UUID NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "content" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "voiceUrl" TEXT,
    "structuredEvent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "balance" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "qrPayload" TEXT NOT NULL DEFAULT '',
    "nfcEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(24,6) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "reference" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scopeType" "FeatureFlagScopeType" NOT NULL,
    "scopeValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_signals" (
    "id" UUID NOT NULL,
    "signalType" "EconomicSignalType" NOT NULL,
    "productId" UUID,
    "organizationId" UUID,
    "zoneCode" TEXT,
    "source" "EconomicSignalSource" NOT NULL,
    "intensityScore" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industrial_pole_configs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "pole" "OrgMemberPole" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dashboardConfig" JSONB NOT NULL DEFAULT '{}',
    "alertPreferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industrial_pole_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE INDEX "organizations_ownerUserId_idx" ON "organizations"("ownerUserId");

-- CreateIndex
CREATE INDEX "organizations_category_country_idx" ON "organizations"("category", "country");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "relationships_upstreamOrganizationId_downstreamOrganization_idx" ON "relationships"("upstreamOrganizationId", "downstreamOrganizationId");

-- CreateIndex
CREATE INDEX "relationships_status_idx" ON "relationships"("status");

-- CreateIndex
CREATE INDEX "contact_suggestions_userId_idx" ON "contact_suggestions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "network_codes_code_key" ON "network_codes"("code");

-- CreateIndex
CREATE INDEX "network_codes_organizationId_idx" ON "network_codes"("organizationId");

-- CreateIndex
CREATE INDEX "catalogs_organizationId_idx" ON "catalogs"("organizationId");

-- CreateIndex
CREATE INDEX "products_organizationId_catalogId_idx" ON "products"("organizationId", "catalogId");

-- CreateIndex
CREATE INDEX "product_visibility_productId_idx" ON "product_visibility"("productId");

-- CreateIndex
CREATE INDEX "product_visibility_visibleToRelationshipId_idx" ON "product_visibility"("visibleToRelationshipId");

-- CreateIndex
CREATE INDEX "orders_buyerOrganizationId_sellerOrganizationId_idx" ON "orders"("buyerOrganizationId", "sellerOrganizationId");

-- CreateIndex
CREATE INDEX "orders_relationshipId_idx" ON "orders"("relationshipId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "negotiations_productId_buyerOrganizationId_sellerOrganizati_idx" ON "negotiations"("productId", "buyerOrganizationId", "sellerOrganizationId");

-- CreateIndex
CREATE INDEX "message_threads_productId_idx" ON "message_threads"("productId");

-- CreateIndex
CREATE INDEX "message_threads_negotiationId_idx" ON "message_threads"("negotiationId");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_organizationId_currency_key" ON "wallets"("organizationId", "currency");

-- CreateIndex
CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");

-- CreateIndex
CREATE INDEX "transactions_organizationId_idx" ON "transactions"("organizationId");

-- CreateIndex
CREATE INDEX "feature_flags_key_idx" ON "feature_flags"("key");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_scopeType_scopeValue_key" ON "feature_flags"("key", "scopeType", "scopeValue");

-- CreateIndex
CREATE INDEX "economic_signals_signalType_createdAt_idx" ON "economic_signals"("signalType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "industrial_pole_configs_organizationId_pole_key" ON "industrial_pole_configs"("organizationId", "pole");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_requesterOrganizationId_fkey" FOREIGN KEY ("requesterOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_receiverOrganizationId_fkey" FOREIGN KEY ("receiverOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_upstreamOrganizationId_fkey" FOREIGN KEY ("upstreamOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_downstreamOrganizationId_fkey" FOREIGN KEY ("downstreamOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_suggestions" ADD CONSTRAINT "contact_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_suggestions" ADD CONSTRAINT "contact_suggestions_suggestedOrganizationId_fkey" FOREIGN KEY ("suggestedOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_codes" ADD CONSTRAINT "network_codes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_visibility" ADD CONSTRAINT "product_visibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_visibility" ADD CONSTRAINT "product_visibility_visibleToOrganizationId_fkey" FOREIGN KEY ("visibleToOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_visibility" ADD CONSTRAINT "product_visibility_visibleToRelationshipId_fkey" FOREIGN KEY ("visibleToRelationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerOrganizationId_fkey" FOREIGN KEY ("buyerOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_sellerOrganizationId_fkey" FOREIGN KEY ("sellerOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_buyerOrganizationId_fkey" FOREIGN KEY ("buyerOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_sellerOrganizationId_fkey" FOREIGN KEY ("sellerOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "negotiations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_buyerOrganizationId_fkey" FOREIGN KEY ("buyerOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_sellerOrganizationId_fkey" FOREIGN KEY ("sellerOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderOrganizationId_fkey" FOREIGN KEY ("senderOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economic_signals" ADD CONSTRAINT "economic_signals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economic_signals" ADD CONSTRAINT "economic_signals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industrial_pole_configs" ADD CONSTRAINT "industrial_pole_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

