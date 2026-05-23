-- Instruction 7: commerce messaging — message types, delivery state, negotiation thread type, offline queue

ALTER TYPE "ThreadType" ADD VALUE IF NOT EXISTS 'NEGOTIATION_CONTEXT';

ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'PAYMENT_PROPOSAL';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'DELIVERY_PROPOSAL';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'REJECTION_EVENT';
ALTER TYPE "MessageType" ADD VALUE IF NOT EXISTS 'CART_CONVERSION_EVENT';

CREATE TYPE "MessageDeliveryState" AS ENUM ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

ALTER TABLE "messages" ADD COLUMN "deliveryState" "MessageDeliveryState" NOT NULL DEFAULT 'SENT';

CREATE TABLE "pending_outbound_messages" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "deliveryState" "MessageDeliveryState" NOT NULL DEFAULT 'SENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_outbound_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pending_outbound_messages_deliveryState_createdAt_idx" ON "pending_outbound_messages"("deliveryState", "createdAt");

ALTER TABLE "pending_outbound_messages" ADD CONSTRAINT "pending_outbound_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
