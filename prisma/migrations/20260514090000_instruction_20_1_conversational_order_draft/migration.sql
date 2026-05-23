-- Instruction 20.1 — conversational relational negotiation draft (corridor-private, heuristic layer).
ALTER TABLE "message_threads" ADD COLUMN "conversationalOrderDraft" JSONB NOT NULL DEFAULT '{}'::jsonb;
