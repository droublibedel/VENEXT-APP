import { Injectable } from "@nestjs/common";
import type {
  DelayCongestionRadarResponse,
  DeliveryRouteIntelligenceResponse,
  FulfillmentStabilityMatrixResponse,
  LoadingSupervisionResponse,
  ShipmentHealthResponse,
  SupplyIntervention,
  SupplyInterventionRankingBasis,
  SupplyInterventionsResponse,
  SupplyOverviewResponse,
  SupplyRiskMatrixResponse,
  TerritoryFlowResponse,
  WarehousePressureResponse,
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
  overview: SupplyOverviewResponse;
  territoryFlow: TerritoryFlowResponse;
  shipmentHealth: ShipmentHealthResponse;
  routes: DeliveryRouteIntelligenceResponse;
  warehouse: WarehousePressureResponse;
  loading: LoadingSupervisionResponse;
  delay: DelayCongestionRadarResponse;
  riskMatrix: SupplyRiskMatrixResponse;
  fulfillmentStability: FulfillmentStabilityMatrixResponse;
};

function rank(i: SupplyIntervention): SupplyIntervention {
  const u = urgencyScoreFromLevels(i.urgency);
  const impactScore = impactScoreFromTextLength(i.expectedImpact.length, 200);
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
  const rankingBasis: SupplyInterventionRankingBasis = {
    urgencyScore: ranked.urgencyScore,
    impactScore: ranked.impactScore,
    confidenceScore: ranked.confidenceScore,
    signalStrengthScore: ranked.signalStrengthScore,
    territoryFactor: ranked.territoryFactor,
    finalScore: ranked.finalScore,
  };
  return { ...i, rankingBasis, finalScore: ranked.finalScore };
}

function corridorDestinations(keys: string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const parts = k.split("→");
    const tail = parts[parts.length - 1]?.trim();
    if (tail) out.push(tail);
  }
  return [...new Set(out)].slice(0, 6);
}

function riskTerritories(risk: SupplyRiskMatrixResponse): string[] {
  const acc: string[] = [];
  for (const row of risk.rows) {
    acc.push(...row.affectedTerritories);
  }
  return [...new Set(acc)].slice(0, 8);
}

function flowTerritories(tf: TerritoryFlowResponse): string[] {
  if (tf.policy === "DISABLED") return [];
  const t = [...tf.overloadedTerritories, ...tf.weakSupplyTerritories];
  if (t.length) return [...new Set(t)].slice(0, 8);
  return tf.cells.slice(0, 6).map((c) => c.territoryKey);
}

function healthTerritories(sh: ShipmentHealthResponse): string[] {
  if (sh.policy === "DISABLED") return [];
  const keys = sh.rows
    .filter((r) => r.executionHealth === "unstable" || r.executionHealth === "suspicious" || r.executionHealth === "blocked")
    .map((r) => r.corridorKey.split("→").pop()?.trim())
    .filter(Boolean) as string[];
  return [...new Set(keys)].slice(0, 8);
}

@Injectable()
export class SupplyInterventionsService {
  synthesize(input: SynthInput): SupplyInterventionsResponse {
    const { organizationId, generatedAt, overview, territoryFlow, shipmentHealth, routes, warehouse, loading, delay, riskMatrix, fulfillmentStability } =
      input;
    const interventions: SupplyIntervention[] = [];

    if (overview.policy !== "ACTIVE") {
      return { generatedAt, organizationId, interventions: [] };
    }

    const baseTerr = [...flowTerritories(territoryFlow), ...riskTerritories(riskMatrix), ...healthTerritories(shipmentHealth)];
    const territoryPool = [...new Set(baseTerr)].filter(Boolean).slice(0, 8);

    if (overview.routeCongestionIndex > 0.52) {
      interventions.push({
        id: "int-prioritize-route",
        kind: "prioritize_route",
        urgency: "high",
        expectedImpact: "Reduce corridor compression — sequence high-confidence routes before collapse propagates.",
        confidence: 0.7,
        relatedSignals: ["route_congestion", `index:${overview.routeCongestionIndex.toFixed(2)}`],
        affectedTerritories: corridorDestinations(routes.overloadedRoutes).length
          ? corridorDestinations(routes.overloadedRoutes)
          : territoryPool.slice(0, 4),
      });
    }

    if (overview.warehousePressureIndex > 0.5) {
      const hubs = warehouse.rows.filter((r) => r.saturation > 0.48).map((r) => r.territory);
      interventions.push({
        id: "int-reduce-warehouse-pressure",
        kind: "reduce_warehouse_pressure",
        urgency: "high",
        expectedImpact: "Throttle dispatch queue — rebalance hub saturation vs downstream commitments.",
        confidence: 0.68,
        relatedSignals: ["warehouse_pressure", ...warehouse.rows.map((r) => `source:${r.source}`)],
        affectedTerritories: hubs.length ? hubs : territoryPool.slice(0, 3),
      });
    }

    if ((loading.loadingDelayCount ?? 0) > 2 || overview.loadingDelayIndex > 0.45) {
      interventions.push({
        id: "int-supervise-loading",
        kind: "supervise_loading_dock",
        urgency: "medium",
        expectedImpact: "Clear loading dwell — unlock accepted orders stuck pre-dispatch.",
        confidence: 0.63,
        relatedSignals: ["loading_delay", `queue:${loading.queueCongestionScore}`],
        affectedTerritories: territoryPool.slice(0, 3),
      });
    }

    if ((delay.territoryCollapseRisk ?? 0) > 0.42) {
      interventions.push({
        id: "int-reinforce-territory",
        kind: "reinforce_territory",
        urgency: "critical",
        expectedImpact: "Reinforce weak territories — preempt downstream supply rupture.",
        confidence: 0.72,
        relatedSignals: ["territory_collapse_risk", ...territoryFlow.weakSupplyTerritories.slice(0, 2)],
        affectedTerritories: territoryFlow.weakSupplyTerritories.length ? territoryFlow.weakSupplyTerritories.slice(0, 4) : territoryPool.slice(0, 4),
      });
    }

    if ((routes.congestionClusters ?? 0) > 2) {
      interventions.push({
        id: "int-stabilize-corridor",
        kind: "stabilize_corridor",
        urgency: "medium",
        expectedImpact: "Stabilize bottleneck corridors — split prep waves vs single chokepoint.",
        confidence: 0.61,
        relatedSignals: ["route_bottleneck", `clusters:${routes.congestionClusters}`],
        affectedTerritories: corridorDestinations(routes.overloadedRoutes).length
          ? corridorDestinations(routes.overloadedRoutes)
          : territoryPool.slice(0, 4),
      });
    }

    if (overview.fulfillmentConfidence < 0.45) {
      interventions.push({
        id: "int-rebalance-fulfillment",
        kind: "rebalance_fulfillment",
        urgency: "high",
        expectedImpact: "Rebalance fulfillment promises — align execution capacity with order mass.",
        confidence: 0.64,
        relatedSignals: ["fulfillment_confidence_low", `stability:${fulfillmentStability.stabilityScore.toFixed(2)}`],
        affectedTerritories: territoryPool.slice(0, 4),
      });
    }

    if ((routes.rows?.filter((r) => r.recurringFailureHint > 0.35).length ?? 0) > 0) {
      interventions.push({
        id: "int-reroute-shipment",
        kind: "reroute_shipment",
        urgency: "medium",
        expectedImpact: "Reroute or split loads on recurring failure corridors — telemetry-ready when GPS lands.",
        confidence: 0.57,
        relatedSignals: ["recurring_route_failure_hint"],
        affectedTerritories: corridorDestinations(routes.overloadedRoutes).length
          ? corridorDestinations(routes.overloadedRoutes)
          : territoryPool.slice(0, 3),
      });
    }

    if (
      delay.abnormalLatencyIndex > 0.58 ||
      delay.recurringDelayScore > 0.6 ||
      (delay.routeInstability > 0.62 && delay.recurringDelayScore > 0.45)
    ) {
      interventions.push({
        id: "int-reduce-delay-propagation",
        kind: "reduce_delay_propagation",
        urgency: "high",
        expectedImpact: "Contain delay propagation — isolate recurring latency corridors before systemic backlog.",
        confidence: 0.69,
        relatedSignals: [
          "delay_radar_critical",
          `abnormalLatency:${delay.abnormalLatencyIndex.toFixed(2)}`,
          `recurring:${delay.recurringDelayScore.toFixed(2)}`,
        ],
        affectedTerritories: delay.hotspots.length ? delay.hotspots.map((h) => h.key.split("→").pop() ?? h.key).slice(0, 5) : territoryPool.slice(0, 4),
      });
    }

    const criticalHub = warehouse.rows.find((r) => r.saturation > 0.58 && r.queueInstability > 0.52);
    if (criticalHub) {
      interventions.push({
        id: "int-supervise-unstable-hub",
        kind: "supervise_unstable_hub",
        urgency: "critical",
        expectedImpact: "Supervise unstable hub — dispatch saturation and queue instability coupling detected.",
        confidence: 0.73,
        relatedSignals: ["hub_pressure_critical", `hubCode:${criticalHub.hubCode}`, `source:${criticalHub.source}`],
        affectedTerritories: criticalHub.territory ? [criticalHub.territory] : territoryPool.slice(0, 2),
      });
    }

    if (shipmentHealth.suspiciousCount > 1 || shipmentHealth.unstableCount > 3) {
      interventions.push({
        id: "int-shipment-health-response",
        kind: "tighten_shipment_supervision",
        urgency: "medium",
        expectedImpact: "Address shipment health degradation — suspicious or unstable execution cluster.",
        confidence: 0.6,
        relatedSignals: [`suspicious:${shipmentHealth.suspiciousCount}`, `unstable:${shipmentHealth.unstableCount}`],
        affectedTerritories: healthTerritories(shipmentHealth).length ? healthTerritories(shipmentHealth) : territoryPool.slice(0, 3),
      });
    }

    const ranked = interventions.map(rank).sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
    return { generatedAt, organizationId, interventions: ranked.slice(0, 16) };
  }
}
