import { z } from "zod";

/** Kafka-ready envelope — versioning + trace propagation */
export const DomainEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  schemaVersion: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().uuid(),
  eventType: z.string().min(1),
  producer: z.string().min(1),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
  payload: z.record(z.unknown()),
});

export type DomainEventEnvelope = z.infer<typeof DomainEventEnvelopeSchema>;

export function parseDomainEventEnvelope(
  raw: unknown,
): DomainEventEnvelope {
  return DomainEventEnvelopeSchema.parse(raw);
}
