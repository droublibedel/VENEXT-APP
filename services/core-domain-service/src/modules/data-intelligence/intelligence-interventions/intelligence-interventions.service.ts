import { Injectable } from "@nestjs/common";
import { ShipmentStatus } from "@prisma/client";
import type { IntelligenceIntervention, IntelligenceInterventionsResponse } from "@venext/shared-contracts";
import {
  impactScoreFromTextLength,
  rankInterventionBySignalScore,
  signalStrengthScoreFromCount,
  territoryFactorFromCount,
  urgencyScoreFromLevels,
} from "../../intervention-ranking/intervention-signal-ranking.util";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class IntelligenceInterventionsService {
  synthesize(s: DataIntelligenceCrossCutSnapshot, enabled: boolean): IntelligenceInterventionsResponse {
    if (!enabled) {
      return { version: "1", generatedAt: s.generatedAt, organizationId: s.organizationId, interventions: [] };
    }

    const terr = [...new Set(s.finance.orders.map((o) => `${o.buyer.city}|${o.buyer.country}`))].slice(0, 4);
    const terrKeys = terr.map((x) => x.split("|")[0] ?? "UNK");

    const raw: Omit<IntelligenceIntervention, "rankingBasis" | "finalScore">[] = [];

    if (s.supply.shipments.length > 2) {
      raw.push({
        id: "int-supply-stress",
        kind: "reduce_supply_chain_stress",
        headline: "Sequence hub dispatch before corridor commits on non-terminal shipments.",
        urgency: "high",
        affectedTerritories: terrKeys,
        relatedSignals: ["supply_shipments", "supply_orders"],
        impactedPoles: ["supply_logistics", "order_adv"],
        sourceSignals: ["supply.shipments.shipmentStatus", "supply.orders.length"],
        confidence: 0.68,
      });
    }

    if (s.commercial.relationships.length > 40) {
      raw.push({
        id: "int-network-frag",
        kind: "reduce_network_fragility",
        headline: "Graph density high — isolate weak trust edges before they couple to payment anomalies.",
        urgency: "medium",
        affectedTerritories: terrKeys.slice(0, 2),
        relatedSignals: ["commercial_relationships", "finance_unpaid"],
        impactedPoles: ["commercial_network", "finance_collections"],
        sourceSignals: ["commercial.relationships.length", "finance.orders.paymentStatus"],
        confidence: 0.61,
      });
    }

    raw.push({
      id: "int-liquidity",
      kind: "protect_liquidity",
      headline: "Guard treasury lane — pair receivable cadence with ADV settlement proposals.",
      urgency: "medium",
      affectedTerritories: terrKeys,
      relatedSignals: ["finance_wallets", "finance_orders"],
      impactedPoles: ["finance_collections", "order_adv"],
      sourceSignals: ["finance.wallets", "finance.orders.paymentStatus"],
      confidence: 0.58,
    });

    raw.push({
      id: "int-territory",
      kind: "stabilize_territory",
      headline: "Reinforce territory lattice where unpaid mass and logistics stress co-locate.",
      urgency: "high",
      affectedTerritories: terrKeys,
      relatedSignals: ["territory_finance", "supply_corridors"],
      impactedPoles: ["finance_collections", "supply_logistics"],
      sourceSignals: ["finance.orders.buyer.geo", "supply.shipments"],
      confidence: 0.63,
    });

    raw.push({
      id: "int-anomaly",
      kind: "isolate_anomaly",
      headline: "Contain anomaly cluster — verify orphan relationship references vs finance orders.",
      urgency: "low",
      affectedTerritories: [],
      relatedSignals: ["data_quality_orphans"],
      impactedPoles: ["commercial_network", "finance_collections"],
      sourceSignals: ["finance.orders.relationshipId", "commercial.relationships.id"],
      confidence: 0.55,
    });

    const weakTrustEdges = s.commercial.relationships.filter(
      (r) => typeof r.trustLevel === "number" && r.trustLevel < 0.42,
    ).length;
    const weakCred = (s.commercial.partnersPack?.counterparties ?? []).filter((c) => (c.credibilityScore ?? 0.5) < 0.42).length;
    if (weakTrustEdges > 3 || weakCred > 2) {
      raw.push({
        id: "int-reinforce-cluster",
        kind: "reinforce_relationship_cluster",
        headline: "Reinforce weak trust / credibility cluster before ADV receivable coupling widens.",
        urgency: "medium",
        affectedTerritories: terrKeys.slice(0, 3),
        relatedSignals: ["commercial_trust", "graph_weak_clusters"],
        impactedPoles: ["commercial_network", "order_adv"],
        sourceSignals: ["commercial.relationships.trustLevel", "commercial.partnersPack.counterparties.credibilityScore"],
        confidence: 0.6,
      });
    }

    const shipStress =
      s.supply.shipments.length > 0
        ? s.supply.shipments.filter((sh) => sh.shipmentStatus !== ShipmentStatus.DELIVERED).length / s.supply.shipments.length
        : 0;
    if (shipStress > 0.25 && s.marketingSummary.available) {
      raw.push({
        id: "int-distribution-flow",
        kind: "stabilize_distribution_flow",
        headline: "Throttle activation pushes on corridors where logistics non-terminal share is elevated.",
        urgency: "high",
        affectedTerritories: terrKeys,
        relatedSignals: ["supply_motion", "marketing_territory_stimulation"],
        impactedPoles: ["supply_logistics", "marketing_activation"],
        sourceSignals: ["supply.shipments.shipmentStatus", "marketingSummary.metrics.territoryStimulation"],
        confidence: 0.62,
      });
    }

    if (s.negotiationMetrics.openNegotiationsCount > 6 || s.economicSignals7d > 25) {
      raw.push({
        id: "int-prediction-risk",
        kind: "reduce_prediction_risk",
        headline: "Sequence executive mediation on negotiation surface and tighten signal governance before predictive tails widen.",
        urgency: "medium",
        affectedTerritories: terrKeys.slice(0, 2),
        relatedSignals: ["predictive_negotiation", "economic_signals_7d"],
        impactedPoles: ["order_adv", "strategic_intelligence"],
        sourceSignals: [
          `negotiation.openCount:${s.negotiationMetrics.openNegotiationsCount}`,
          `economic_signals_7d:${s.economicSignals7d}`,
        ],
        confidence: 0.57,
      });
    }

    const ranked: IntelligenceIntervention[] = raw.map((i) => {
      const u = urgencyScoreFromLevels(i.urgency);
      const impactScore = impactScoreFromTextLength(i.headline.length, 200);
      const rankedInner = rankInterventionBySignalScore({
        urgencyScore: u,
        impactScore,
        confidenceScore: i.confidence,
        signalStrengthScore: signalStrengthScoreFromCount(i.relatedSignals.length, 6),
        territoryFactor: territoryFactorFromCount(i.affectedTerritories.length, 5),
      });
      return {
        ...i,
        rankingBasis: {
          urgencyScore: rankedInner.urgencyScore,
          impactScore: rankedInner.impactScore,
          confidenceScore: rankedInner.confidenceScore,
          signalStrengthScore: rankedInner.signalStrengthScore,
          territoryFactor: rankedInner.territoryFactor,
          finalScore: rankedInner.finalScore,
        },
        finalScore: rankedInner.finalScore,
      };
    });

    ranked.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      interventions: ranked.slice(0, 16),
    };
  }
}
