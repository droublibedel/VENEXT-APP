-- Instruction 20.1A — Negotiation draft metadata (no hard ACCEPTED from conversational confirm).
ALTER TABLE "negotiations" ADD COLUMN "negotiationDraftMetadata" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Distinct source for symbolic conversational reservations (filterable vs real stock paths).
ALTER TYPE "ReservationIntentSource" ADD VALUE 'CONVERSATIONAL_SYMBOLIC_DRAFT';
