/**
 * Instruction 12A — Commercial pole realtime contract (single WS engine; api-gateway `/realtime`).
 * Payload shape: `{ type, channel?, items: OperationalSignalItem[] }` — same item batching as operational signals.
 */
export const COMMERCIAL_REALTIME_EVENT_TYPES = [
  "demo.commercial.relationship.event",
  "demo.commercial.retailer.pressure",
  "demo.commercial.sponsorship.spike",
  "live.commercial.relationship.event",
  "live.commercial.retailer.pressure",
  "live.commercial.sponsorship.spike",
] as const;

export type CommercialRealtimeEventType = (typeof COMMERCIAL_REALTIME_EVENT_TYPES)[number];
