/**
 * Instruction 20.2A — stable aggregation keys for sponsored exposure (upsert, no append-only spam).
 */
export type SponsoredExposureEventType =
  | "IMPRESSION"
  | "OPEN"
  | "RELATIONSHIP_REQUEST"
  | "RELATIONSHIP_ACCEPTED"
  /** Instruction 20.2B — post-sync moderation (distinct from generic RELATIONSHIP_ACCEPTED bucket). */
  | "RELATIONSHIP_ACCEPTED_SYNCED"
  | "RELATIONSHIP_REJECTED_SYNCED"
  | "WINDOW_EXPIRED";

export function utcDateBucketIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildSponsoredExposureAggregationKey(input: {
  campaignId: string;
  sponsorOrganizationId: string;
  region: string | null;
  city: string | null;
  district: string | null;
  targetActorType: string;
  eventType: SponsoredExposureEventType;
  dateUtc: string;
}): string {
  const r = input.region?.trim() || "_";
  const c = input.city?.trim() || "_";
  const di = input.district?.trim() || "_";
  return `${input.campaignId}|${input.sponsorOrganizationId}|${r}|${c}|${di}|${input.targetActorType}|${input.dateUtc}|${input.eventType}`;
}
