/**
 * Instruction 13 — Marketing / activation pole realtime (single WS engine; `/realtime`).
 * Payload: `{ type, channel?, items: OperationalSignalItem[] }` — same batching as operational signals.
 */
export const MARKETING_REALTIME_EVENT_TYPES = [
  "demo.marketing.sponsorship.spike",
  "demo.marketing.activation.burst",
  "demo.marketing.momentum.shift",
  "demo.marketing.retailer.engagement.burst",
  "demo.marketing.campaign.pressure",
  "live.marketing.sponsorship.spike",
  "live.marketing.activation.burst",
  "live.marketing.momentum.shift",
  "live.marketing.retailer.engagement.burst",
  "live.marketing.campaign.pressure",
] as const;

export type MarketingRealtimeEventType = (typeof MARKETING_REALTIME_EVENT_TYPES)[number];
