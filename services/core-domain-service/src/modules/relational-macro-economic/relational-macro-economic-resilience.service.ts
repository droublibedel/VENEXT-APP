import { Injectable } from "@nestjs/common";
import {
  RelationalMacroEconomicResilienceStatus,
  RelationalMacroEconomicRiskLevel,
} from "@prisma/client";

import type { MacroEconomicCorridorContext } from "./relational-macro-economic-corridor-context.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";

export type MacroResilienceScores = {
  resilienceScore: number;
  structuralFragility: number;
  operationalContinuity: number;
  dependencyExposure: number;
  adaptationCapacity: number;
  systemicPressure: number;
  economicStress: number;
  corridorRecoveryProbability: number;
  macroEconomicRisk: number;
  propagationRisk: number;
  fragilityScore: number;
  resilienceStatus: RelationalMacroEconomicResilienceStatus;
  riskLevel: RelationalMacroEconomicRiskLevel;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalMacroEconomicResilienceService {
  constructor(private readonly policy: RelationalMacroEconomicPolicyService) {}

  computeResilience(ctx: MacroEconomicCorridorContext): MacroResilienceScores {
    const incidentWeight = Math.min(100, ctx.openIncidentCount * 10);
    const coordinationWeight = Math.min(
      100,
      ctx.coordinationOpenCount * 4 + ctx.blockingTaskCount * 12,
    );
    const pressureWeight = ctx.pressureScore;
    const geoFragilityWeight = ctx.geoFragilityScore;
    const sectorRiskWeight = ctx.sectorOperationalRisk;
    const supplyFlowWeight = ctx.supplyFlowDisruptionAvg;
    const predictiveWeight =
      ctx.predictiveUnresolvedCount === 0
        ? 0
        : Math.min(100, Math.round(ctx.predictiveUnresolvedAvgScore * 0.55));
    const memoryWeight =
      ctx.strategicMemoryActiveCount === 0
        ? 0
        : Math.min(100, Math.round(ctx.strategicMemoryActiveCount * 5 + ctx.strategicMemoryAvgConfidence * 0.15));
    const metricsWeight = ctx.operationalMetricStress;
    const commandWeight = ctx.commandCenterStress;
    const orchestrationWeight = Math.min(100, ctx.orchestrationOpenCount * 8);
    const peerWeight = Math.min(100, ctx.peerPressureEdgeCount * 2);

    const structuralFragility = this.policy.clampInt(
      geoFragilityWeight * 0.22 +
        sectorRiskWeight * 0.2 +
        ctx.sectorFragility * 0.18 +
        supplyFlowWeight * 0.2 +
        pressureWeight * 0.2,
    );
    const dependencyExposure = this.policy.clampInt(
      peerWeight * 0.35 + incidentWeight * 0.25 + coordinationWeight * 0.2 + supplyFlowWeight * 0.2,
    );
    const systemicPressure = this.policy.clampInt(
      pressureWeight * 0.28 +
        commandWeight * 0.22 +
        predictiveWeight * 0.15 +
        orchestrationWeight * 0.15 +
        metricsWeight * 0.2,
    );
    const economicStress = this.policy.clampInt(
      systemicPressure * 0.45 + structuralFragility * 0.35 + dependencyExposure * 0.2,
    );
    const operationalContinuity = this.policy.clampInt(
      100 - incidentWeight * 0.35 - coordinationWeight * 0.25 - supplyFlowWeight * 0.25 - economicStress * 0.15,
    );
    const adaptationCapacity = this.policy.clampInt(
      memoryWeight * 0.35 +
        operationalContinuity * 0.35 +
        (100 - structuralFragility) * 0.15 +
        (ctx.simulationOpenCount > 0 ? 12 : 0) +
        (ctx.scenarioReviewOpenCount > 0 ? 8 : 0),
    );
    const resilienceScore = this.policy.clampInt(
      operationalContinuity * 0.35 +
        adaptationCapacity * 0.25 +
        (100 - structuralFragility) * 0.2 +
        (100 - dependencyExposure) * 0.2,
    );
    const propagationRisk = this.policy.clampInt(
      systemicPressure * 0.4 + dependencyExposure * 0.35 + structuralFragility * 0.25,
    );
    const fragilityScore = this.policy.clampInt(
      structuralFragility * 0.55 + (100 - resilienceScore) * 0.25 + propagationRisk * 0.2,
    );
    const macroEconomicRisk = this.policy.clampInt(
      economicStress * 0.4 + fragilityScore * 0.35 + propagationRisk * 0.25,
    );
    const corridorRecoveryProbability = this.policy.clampProb(
      resilienceScore / 120 + adaptationCapacity / 200 - macroEconomicRisk / 250,
    );

    const resilienceStatus = this.toResilienceStatus(resilienceScore, fragilityScore);
    const riskLevel = this.toRiskLevel(macroEconomicRisk);

    return {
      resilienceScore,
      structuralFragility,
      operationalContinuity,
      dependencyExposure,
      adaptationCapacity,
      systemicPressure,
      economicStress,
      corridorRecoveryProbability,
      macroEconomicRisk,
      propagationRisk,
      fragilityScore,
      resilienceStatus,
      riskLevel,
      diagnostics: {
        computedFrom: [
          "fulfillment_incidents",
          "coordination_tasks",
          "economic_pressure",
          "geo_economic",
          "sector_intelligence",
          "supply_flow",
          "predictive_risk",
          "strategic_memory",
          "operational_metrics",
          "command_center",
          "orchestration",
          "peer_pressure_edges",
        ],
        incidentWeight,
        coordinationWeight,
        pressureWeight,
        geoFragilityWeight,
        sectorRiskWeight,
        supplyFlowWeight,
        predictiveWeight,
        memoryWeight,
        metricsWeight,
        commandWeight,
        orchestrationWeight,
        peerWeight,
        heuristicFallbackUsed: ctx.heuristicFallbackUsed,
        fallbackReasons: ctx.fallbackReasons,
      },
    };
  }

  private toResilienceStatus(
    resilience: number,
    fragility: number,
  ): RelationalMacroEconomicResilienceStatus {
    if (fragility >= 78 || resilience <= 28) return RelationalMacroEconomicResilienceStatus.CRITICAL;
    if (fragility >= 62 || resilience <= 42) return RelationalMacroEconomicResilienceStatus.FRAGILE;
    if (fragility >= 48 || resilience <= 55) return RelationalMacroEconomicResilienceStatus.STRESSED;
    if (fragility >= 35 || resilience <= 68) return RelationalMacroEconomicResilienceStatus.WATCH;
    return RelationalMacroEconomicResilienceStatus.STABLE;
  }

  private toRiskLevel(risk: number): RelationalMacroEconomicRiskLevel {
    if (risk < 32) return RelationalMacroEconomicRiskLevel.LOW;
    if (risk < 55) return RelationalMacroEconomicRiskLevel.MEDIUM;
    if (risk < 78) return RelationalMacroEconomicRiskLevel.HIGH;
    return RelationalMacroEconomicRiskLevel.SEVERE;
  }
}
