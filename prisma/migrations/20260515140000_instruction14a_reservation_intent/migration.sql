-- Instruction 14A — ReservationIntent foundation for order / ADV allocation.

CREATE TYPE "ReservationIntentStatus" AS ENUM ('REQUESTED', 'RESERVED', 'EXPIRED', 'CANCELLED', 'CONVERTED_TO_ORDER');

CREATE TYPE "ReservationIntentSource" AS ENUM ('CONVERSATION', 'NEGOTIATION', 'CART', 'GROUP_BUYING', 'MANUAL_ADV');

CREATE TABLE "reservation_intents" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "relationshipId" UUID,
    "productId" UUID NOT NULL,
    "orderId" UUID,
    "negotiationId" UUID,
    "requestedQuantity" DECIMAL(18,4) NOT NULL,
    "reservedQuantity" DECIMAL(18,4),
    "status" "ReservationIntentStatus" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "source" "ReservationIntentSource" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_intents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reservation_intents_organizationId_status_idx" ON "reservation_intents"("organizationId", "status");

CREATE INDEX "reservation_intents_productId_status_idx" ON "reservation_intents"("productId", "status");

ALTER TABLE "reservation_intents" ADD CONSTRAINT "reservation_intents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservation_intents" ADD CONSTRAINT "reservation_intents_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reservation_intents" ADD CONSTRAINT "reservation_intents_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservation_intents" ADD CONSTRAINT "reservation_intents_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reservation_intents" ADD CONSTRAINT "reservation_intents_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "negotiations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
