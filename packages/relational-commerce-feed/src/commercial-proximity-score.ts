import { computeGeographicProximityScore } from "commercial-location-terrain";
import { proximityLevel } from "./commercial-interest-proximity-engine.js";
import type { PartnerSuggestionCandidate } from "./relational-feed.types.js";

export type CommercialProximityScoreInput = {
  viewerActivity: string;
  viewerCity?: string;
  candidate: PartnerSuggestionCandidate;
  sentInvitation?: boolean;
  viewedCatalog?: boolean;
};

/** Score relationnel — contacts mutuels prioritaires. */
export function computeCommercialProximityScore(input: CommercialProximityScoreInput): number {
  const { candidate, viewerActivity, viewerCity } = input;
  let score = 0;

  const level = proximityLevel(viewerActivity, candidate.activityCategory);
  if (level === 1) score += 40;
  else if (level === 2) score += 30;
  else if (level === 3) score += 20;
  else if (level === 4) score += 10;
  else return 0;

  if (candidate.mutualContact) score += 35;
  const geoBoost = Math.round(computeGeographicProximityScore(viewerCity, candidate.city) * 0.2);
  score += geoBoost;
  if (input.sentInvitation) score += 5;
  if (input.viewedCatalog) score += 8;
  if (candidate.catalogPreviewUrls?.length) score += 5;
  if (candidate.businessAudioUrl) score += 3;

  return Math.min(100, score);
}

export function rankByCommercialProximity<T extends { proximityScore: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.proximityScore - a.proximityScore);
}
