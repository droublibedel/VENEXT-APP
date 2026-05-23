import { Injectable } from "@nestjs/common";
import type {
  DeliveryPriorityResponse,
  GroupBuyingSupervisionResponse,
  NegotiationIntelligenceResponse,
  OrderAdvIntervention,
  OrderAdvInterventionRankingBasis,
  OrderAdvInterventionsResponse,
  OrderPressureResponse,
  OrdersOverviewResponse,
  ReservationAllocationResponse,
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
  overview: OrdersOverviewResponse;
  orderPressure?: OrderPressureResponse | null;
  negotiations?: NegotiationIntelligenceResponse | null;
  groupBuying?: GroupBuyingSupervisionResponse | null;
  reservations?: ReservationAllocationResponse | null;
  delivery?: DeliveryPriorityResponse | null;
};

function rank(i: OrderAdvIntervention): OrderAdvIntervention {
  const u = urgencyScoreFromLevels(i.urgency);
  const impactScore = impactScoreFromTextLength(i.expectedImpact.length, 180);
  const confidenceScore = i.confidence;
  const signalStrengthScore = signalStrengthScoreFromCount(i.relatedSignals.length, 6);
  const territoryFactor = territoryFactorFromCount(i.affectedTerritories.length, 5);
  const ranked = rankInterventionBySignalScore({
    urgencyScore: u,
    impactScore,
    confidenceScore,
    signalStrengthScore,
    territoryFactor,
  });
  const rankingBasis: OrderAdvInterventionRankingBasis = {
    urgencyScore: ranked.urgencyScore,
    impactScore: ranked.impactScore,
    confidenceScore: ranked.confidenceScore,
    signalStrengthScore: ranked.signalStrengthScore,
    territoryFactor: ranked.territoryFactor,
    finalScore: ranked.finalScore,
  };
  return { ...i, rankingBasis, finalScore: ranked.finalScore };
}

function topTerritories(orderPressure: OrderPressureResponse | null | undefined, max: number): string[] {
  if (!orderPressure || orderPressure.policy === "DISABLED") return [];
  const fromSurge = orderPressure.surgeTerritories ?? [];
  if (fromSurge.length) return fromSurge.slice(0, max);
  return (orderPressure.cells ?? []).slice(0, max).map((c) => c.territoryKey);
}

@Injectable()
export class TransactionInterventionsService {
  synthesize(input: SynthInput): OrderAdvInterventionsResponse {
    const { organizationId, generatedAt, overview, orderPressure, negotiations, groupBuying, reservations, delivery } = input;
    const interventions: OrderAdvIntervention[] = [];
    const territories = topTerritories(orderPressure ?? null, 5);

    if (overview.policy !== "ACTIVE") {
      return { generatedAt, organizationId, interventions: [] };
    }

    if (overview.delayedOrders > 3) {
      interventions.push({
        id: "int-prioritize-distributor",
        kind: "prioritize_distributor",
        urgency: overview.delayedOrders > 8 ? "critical" : "high",
        expectedImpact: "Clear ADV chokepoints before fulfillment collapse propagates to retailer trust.",
        confidence: 0.71,
        relatedSignals: ["delayed_orders", "delivery_tension", `delayed_count:${overview.delayedOrders}`],
        affectedTerritories: territories.length ? territories : [],
      });
    }

    if (overview.negotiationIntensity > 0.52 || (negotiations && negotiations.unstableNegotiations > 4)) {
      interventions.push({
        id: "int-escalate-negotiation",
        kind: "escalate_negotiation",
        urgency: "high",
        expectedImpact: "Stabilize counter-offer loops with relationship-native mediation.",
        confidence: 0.67,
        relatedSignals: [
          "negotiation_intensity",
          negotiations ? `unstable_negotiations:${negotiations.unstableNegotiations}` : "negotiation_intensity_only",
        ],
        affectedTerritories: territories.slice(0, 3),
      });
    }

    const stalledGb =
      groupBuying?.rows?.filter((r) => r.velocityHint === "stalled" && r.status === "OPEN").length ?? 0;
    if (overview.groupedBuyingActivity > 0.45 || stalledGb > 1) {
      interventions.push({
        id: "int-reinforce-group-buy",
        kind: "reinforce_grouped_buying",
        urgency: stalledGb > 2 ? "high" : "medium",
        expectedImpact: "Lift grouped-buy completion before expiry drains corridor momentum.",
        confidence: 0.62,
        relatedSignals: ["group_buy_pressure", `stalled_sessions:${stalledGb}`],
        affectedTerritories: territories.slice(0, 2),
      });
    }

    const surgeGb = groupBuying?.rows?.filter((r) => r.velocityHint === "surge").length ?? 0;
    if (surgeGb > 3) {
      interventions.push({
        id: "int-supervise-group-buy-velocity",
        kind: "supervise_group_buy_velocity",
        urgency: "medium",
        expectedImpact: "Velocity sessions risk fulfillment mismatch — align distributor confirmations.",
        confidence: 0.58,
        relatedSignals: ["group_buy_velocity", `surge_sessions:${surgeGb}`],
        affectedTerritories: territories.slice(0, 2),
      });
    }

    const resConflict =
      reservations?.rows?.filter((r) => r.allocationConflictScore > 0.55 || (r.intentReservedUnits ?? 0) > 0).length ?? 0;
    if (overview.reservationPressure > 0.48 || resConflict > 0) {
      interventions.push({
        id: "int-unblock-reservation",
        kind: "unblock_reservation",
        urgency: resConflict > 2 ? "high" : "medium",
        expectedImpact: "Resolve draft / intent allocation conflicts to free execution bandwidth.",
        confidence: 0.59,
        relatedSignals: ["reservation_pressure", `intent_conflict_rows:${resConflict}`],
        affectedTerritories: territories.slice(0, 3),
      });
    }

    if (delivery && delivery.policy === "ACTIVE" && (delivery.fulfillmentInstability > 0.42 || delivery.blockedDeliveries > 0)) {
      interventions.push({
        id: "int-stabilize-fulfillment",
        kind: "stabilize_fulfillment",
        urgency: delivery.blockedDeliveries > 2 ? "high" : "medium",
        expectedImpact: "Unblock failed delivery lanes and reduce confirmation lag on active corridors.",
        confidence: 0.63,
        relatedSignals: [
          "fulfillment_instability",
          `blocked:${delivery.blockedDeliveries}`,
          `instability:${delivery.fulfillmentInstability.toFixed(2)}`,
        ],
        affectedTerritories: territories.slice(0, 3),
      });
    }

    if ((orderPressure?.retailerPressure ?? 0) > 0.55 && overview.transactionConfidence < 0.48) {
      interventions.push({
        id: "int-reduce-order-pressure",
        kind: "reduce_order_pressure",
        urgency: "medium",
        expectedImpact: "Rebalance downstream pacing — tactical cadence vs demand surge.",
        confidence: 0.54,
        relatedSignals: ["transaction_confidence", "retailer_pressure"],
        affectedTerritories: territories.slice(0, 4),
      });
    }

    if ((orderPressure?.distributorOverload ?? 0) > 0.58) {
      interventions.push({
        id: "int-distributor-capacity",
        kind: "distributor_capacity",
        urgency: "high",
        expectedImpact: "Distributor overload envelope — stage confirmations and split corridors.",
        confidence: 0.6,
        relatedSignals: ["distributor_overload"],
        affectedTerritories: territories.slice(0, 4),
      });
    }

    const ranked = interventions.map(rank).sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

    return {
      generatedAt,
      organizationId,
      interventions: ranked.slice(0, 14),
    };
  }
}
