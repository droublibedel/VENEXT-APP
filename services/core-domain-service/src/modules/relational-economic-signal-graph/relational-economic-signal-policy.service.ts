import { Injectable } from "@nestjs/common";
import type {
  RelationalEconomicCorrelationStrength,
  RelationalEconomicPropagationRisk,
  RelationalEconomicSignalSeverity,
} from "@prisma/client";

import { ECONOMIC_GRAPH_OPEN_TASKS_SOURCE } from "./relational-economic-signal-graph.constants";

export const ECONOMIC_GRAPH_ENGINE_THRESHOLDS = {
  maxCascadeDepth: Number(process.env.VENEXT_ECONOMIC_GRAPH_MAX_DEPTH ?? 5),
  maxExposureScore: Number(process.env.VENEXT_ECONOMIC_GRAPH_MAX_EXPOSURE ?? 100),
  correlationIncidentWeight: Number(process.env.VENEXT_ECONOMIC_GRAPH_INCIDENT_W ?? 15),
  correlationSlaWeight: Number(process.env.VENEXT_ECONOMIC_GRAPH_SLA_W ?? 12),
  clusterMinEdgeStrength: Number(process.env.VENEXT_ECONOMIC_GRAPH_CLUSTER_MIN ?? 2),
} as const;

export type CorridorStressSnapshot = {
  openIncidents: number;
  slaAlerts: number;
  criticalSimulations: number;
  activeOrchestrations: number;
  activeRecommendations: number;
  activeMemories: number;
  openTasks: number;
  openTasksComputed: true;
  openTasksSource: typeof ECONOMIC_GRAPH_OPEN_TASKS_SOURCE;
  openTasksIncludedStatuses: readonly string[];
  openTasksExcludedStatuses: readonly string[];
};

@Injectable()
export class RelationalEconomicSignalPolicyService {
  computeStressScore(snapshot: CorridorStressSnapshot): number {
    return Math.min(
      100,
      snapshot.openIncidents * ECONOMIC_GRAPH_ENGINE_THRESHOLDS.correlationIncidentWeight +
        snapshot.slaAlerts * ECONOMIC_GRAPH_ENGINE_THRESHOLDS.correlationSlaWeight +
        snapshot.criticalSimulations * 10 +
        snapshot.activeOrchestrations * 5 +
        snapshot.activeRecommendations * 4 +
        snapshot.activeMemories * 3 +
        snapshot.openTasks * 2,
    );
  }

  severityFromScore(score: number): RelationalEconomicSignalSeverity {
    if (score >= 85) return "CRITICAL";
    if (score >= 65) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  propagationRiskFromScore(score: number, connectedEdgeCount: number): RelationalEconomicPropagationRisk {
    if (score >= 90 || connectedEdgeCount >= 8) return "CASCADE";
    if (score >= 75) return "CRITICAL";
    if (score >= 55) return "HIGH";
    if (score >= 35) return "MEDIUM";
    return "LOW";
  }

  correlationStrengthFromScore(score: number): RelationalEconomicCorrelationStrength {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "STRONG";
    if (score >= 35) return "MODERATE";
    return "WEAK";
  }

  propagationProbabilityFromStrength(strength: RelationalEconomicCorrelationStrength): number {
    switch (strength) {
      case "CRITICAL":
        return 0.85;
      case "STRONG":
        return 0.65;
      case "MODERATE":
        return 0.4;
      default:
        return 0.2;
    }
  }

  boundedCascadeExposure(depth: number, accumulated: number): number {
    const cappedDepth = Math.min(depth, ECONOMIC_GRAPH_ENGINE_THRESHOLDS.maxCascadeDepth);
    return Math.min(
      ECONOMIC_GRAPH_ENGINE_THRESHOLDS.maxExposureScore,
      Math.round(accumulated * (1 - cappedDepth * 0.08)),
    );
  }

  canMutateGraph(corridorState: string): boolean {
    return corridorState !== "TERMINATED";
  }
}
