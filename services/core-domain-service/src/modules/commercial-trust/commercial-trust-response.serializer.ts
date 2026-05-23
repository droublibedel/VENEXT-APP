import type { CommercialTrustDataConfidence, CommercialTrustSignalType } from "@prisma/client";

export type CommercialTrustSignalWire = {
  signalType: CommercialTrustSignalType;
  signalStrength: number;
  heuristicOnly: true;
  confidenceLevel: CommercialTrustDataConfidence;
  explanation: string;
  metadata: Record<string, unknown>;
  computedAt: string;
};

export type CommercialTrustProfileWire = {
  organizationId: string;
  trustLevel: string;
  trustScore: number;
  relationshipCount: number;
  acceptedRelationshipCount: number;
  negotiationCompletionRate: number;
  averageNegotiationResponseMinutes: number | null;
  sponsoredConversationConversionRate: number;
  dormantRelationshipRatio: number;
  unresolvedNegotiationRatio: number;
  symbolicReservationReliability: number;
  deliveryConsistencySignal: number;
  commercialStabilitySignal: number;
  dataConfidenceLevel: CommercialTrustDataConfidence;
  lastComputedAt: string | null;
  heuristicOnly: true;
};

export function trustScoreToCorridorBand(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score < 38) return "LOW";
  if (score < 68) return "MEDIUM";
  return "HIGH";
}

export function bandNumericForPartnerView(band: "LOW" | "MEDIUM" | "HIGH"): number {
  if (band === "LOW") return 17;
  if (band === "MEDIUM") return 50;
  return 83;
}
