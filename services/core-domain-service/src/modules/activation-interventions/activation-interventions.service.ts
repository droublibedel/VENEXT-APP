import { Injectable } from "@nestjs/common";
import type {
  ActivationIntervention,
  ActivationInterventionsResponse,
  InterventionRankingBasis,
  MarketingActivationOverviewResponse,
  ProductMomentumObservatoryResponse,
  SeasonalPressure,
  SponsorshipPressureObservatoryResponse,
  TerritoryActivationRadarResponse,
} from "@venext/shared-contracts";

import {
  impactScoreFromTextLength,
  rankInterventionBySignalScore,
  signalStrengthScoreFromCount,
  territoryFactorFromCount,
  urgencyScoreFromLevels,
} from "../intervention-ranking/intervention-signal-ranking.util";

type SynthInput = {
  organizationId: string;
  generatedAt: string;
  overview: MarketingActivationOverviewResponse;
  sponsorship: SponsorshipPressureObservatoryResponse;
  territory: TerritoryActivationRadarResponse;
  productMomentum: ProductMomentumObservatoryResponse;
  seasonalPressure: SeasonalPressure;
};

function rankIntervention(i: ActivationIntervention): ActivationIntervention {
  const u = urgencyScoreFromLevels(i.urgency);
  const impactScore = impactScoreFromTextLength(i.expectedImpact.length, 160);
  const confidenceScore = i.confidence;
  const signalStrengthScore = signalStrengthScoreFromCount(i.relatedSignals.length, 5);
  const territoryFactor = territoryFactorFromCount(i.affectedTerritories.length, 4);
  const ranked = rankInterventionBySignalScore({
    urgencyScore: u,
    impactScore,
    confidenceScore,
    signalStrengthScore,
    territoryFactor,
  });
  const rankingBasis: InterventionRankingBasis = {
    urgencyScore: ranked.urgencyScore,
    impactScore: ranked.impactScore,
    confidenceScore: ranked.confidenceScore,
    signalStrengthScore: ranked.signalStrengthScore,
    territoryFactor: ranked.territoryFactor,
    finalScore: ranked.finalScore,
  };
  return { ...i, rankingBasis, finalScore: ranked.finalScore };
}

@Injectable()
export class ActivationInterventionsService {
  synthesize(input: SynthInput): ActivationInterventionsResponse {
    const { organizationId, generatedAt, overview, sponsorship, territory, productMomentum, seasonalPressure } = input;
    const interventions: ActivationIntervention[] = [];

    if (sponsorship.policy === "ACTIVE" && (sponsorship.overexposureIndex ?? 0) > 0.65) {
      interventions.push({
        id: "int-sponsor-throttle",
        kind: "reduce_territory_pressure",
        urgency: "high",
        expectedImpact: "Lower trust-surface overload while preserving lane-native discovery.",
        affectedTerritories: territory.rows.filter((r) => r.state === "saturated").map((r) => r.territoryKey),
        confidence: 0.74,
        relatedSignals: ["OVEREXPOSURE", "sponsorship_pressure"],
      });
    }

    if (territory.dormantRegions.length) {
      interventions.push({
        id: "int-dormant-pulse",
        kind: "stimulate_dormant_zone",
        urgency: "medium",
        expectedImpact: "Re-seed negotiation + selective sponsorship depth in quiet corridors.",
        affectedTerritories: territory.dormantRegions,
        confidence: 0.66,
        relatedSignals: ["stimulation_void", "territory_radar"],
      });
    }

    const declining = productMomentum.rows.filter((r) => r.state === "declining" || r.state === "stagnant").slice(0, 3);
    if (declining.length) {
      interventions.push({
        id: "int-momentum-decay",
        kind: "investigate_momentum_decay",
        urgency: "medium",
        expectedImpact: "Isolate SKU decay vs macro demand vs fulfillment friction.",
        affectedTerritories: [],
        confidence: 0.61,
        relatedSignals: declining.map((d) => `product:${d.productId}`),
      });
    }

    if (overview.retailerEngagementLevel < 0.35) {
      interventions.push({
        id: "int-retailer-cluster",
        kind: "activate_retailer_cluster",
        urgency: "high",
        expectedImpact: "Lift downstream behavioral density via relationship-native invitations.",
        affectedTerritories: territory.risingCorridors,
        confidence: 0.58,
        relatedSignals: ["retailer_engagement_low"],
      });
    }

    if (overview.campaignEffectiveness < 0.4) {
      interventions.push({
        id: "int-campaign-decline",
        kind: "supervise_campaign_decline",
        urgency: "medium",
        expectedImpact: "Retune activation waves — efficiency decay flagged in abstraction layer.",
        affectedTerritories: [],
        confidence: 0.55,
        relatedSignals: ["campaign_efficiency"],
      });
    }

    if (seasonalPressure.intensity > 0.55) {
      interventions.push({
        id: "int-seasonal-bridge",
        kind: "calibrate_seasonal_excitation",
        urgency: "medium",
        expectedImpact: `Seasonal / external MOCK_CONTEXT pressure ${seasonalPressure.intensity.toFixed(2)} — align field cadence before distortion hits fulfillment.`,
        affectedTerritories: seasonalPressure.affectedTerritories.slice(0, 6),
        confidence: seasonalPressure.confidence,
        relatedSignals: ["MOCK_CONTEXT:seasonalPressure", seasonalPressure.source],
      });
    }

    interventions.push({
      id: "int-reinforce-momentum",
      kind: "reinforce_product_momentum",
      urgency: "low",
      expectedImpact: "Anchor rising SKUs with corridor sponsorship without spray patterns.",
      affectedTerritories: territory.risingCorridors.slice(0, 2),
      confidence: 0.52,
      relatedSignals: ["product_momentum_top"],
    });

    const ranked = interventions.map(rankIntervention).sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

    return {
      generatedAt,
      organizationId,
      interventions: ranked.slice(0, 12),
    };
  }
}
