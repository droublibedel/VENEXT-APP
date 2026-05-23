import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicContinuityStatus,
  RelationalEconomicStabilitySeverity,
} from "@prisma/client";

import type { EconomicContinuityCorridorContext } from "./relational-economic-continuity-corridor-context.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";

export type ContinuityStabilityScores = {
  continuityScore: number;
  corridorDurability: number;
  economicStability: number;
  instabilityRisk: number;
  continuityPressure: number;
  dependencyDurability: number;
  economicSurvivalProbability: number;
  recoveryProbability: number;
  systemicContinuityRisk: number;
  continuityStatus: RelationalEconomicContinuityStatus;
  severity: RelationalEconomicStabilitySeverity;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalEconomicContinuityStabilityService {
  constructor(private readonly policy: RelationalEconomicContinuityPolicyService) {}

  computeStability(ctx: EconomicContinuityCorridorContext): ContinuityStabilityScores {
    const incidentWeight = Math.min(100, ctx.openIncidentCount * 9);
    const memoryWeight =
      ctx.strategicMemoryActiveCount === 0
        ? 0
        : Math.min(100, Math.round(ctx.strategicMemoryActiveCount * 6 + ctx.strategicMemoryAvgConfidence * 0.12));
    const macroStressWeight = ctx.macroEconomicStress;
    const macroFragilityWeight = ctx.macroStructuralFragility;
    const propagationHistoryWeight = Math.min(100, ctx.macroPropagationEventCount * 6);
    const trendPenalty = ctx.snapshotResilienceTrend < 0 ? Math.min(40, Math.abs(ctx.snapshotResilienceTrend)) : 0;
    const supplyWeight = ctx.supplyFlowDisruptionAvg;
    const sectorWeight = ctx.sectorOperationalRisk;
    const geoWeight = ctx.geoFragilityScore;
    const pressureWeight = ctx.pressureScore;
    const commandWeight = ctx.commandCenterStress;
    const peerWeight = Math.min(100, ctx.peerPressureEdgeCount * 2);

    const economicStability = this.policy.clampInt(
      ctx.macroResilienceScore * 0.35 +
        memoryWeight * 0.2 +
        (100 - macroFragilityWeight) * 0.2 +
        (100 - incidentWeight) * 0.15 +
        (100 - supplyWeight) * 0.1,
    );
    const corridorDurability = this.policy.clampInt(
      economicStability * 0.4 +
        (100 - trendPenalty) * 0.25 +
        ctx.macroResilienceScore * 0.2 +
        memoryWeight * 0.15,
    );
    const continuityPressure = this.policy.clampInt(
      pressureWeight * 0.22 +
        commandWeight * 0.2 +
        macroStressWeight * 0.2 +
        propagationHistoryWeight * 0.18 +
        incidentWeight * 0.2,
    );
    const instabilityRisk = this.policy.clampInt(
      macroFragilityWeight * 0.28 +
        geoWeight * 0.18 +
        sectorWeight * 0.18 +
        supplyWeight * 0.16 +
        trendPenalty * 0.2,
    );
    const dependencyDurability = this.policy.clampInt(
      peerWeight * 0.3 + memoryWeight * 0.25 + corridorDurability * 0.25 + (100 - instabilityRisk) * 0.2,
    );
    const continuityScore = this.policy.clampInt(
      economicStability * 0.35 + corridorDurability * 0.3 + dependencyDurability * 0.2 - continuityPressure * 0.15,
    );
    const systemicContinuityRisk = this.policy.clampInt(
      instabilityRisk * 0.4 + continuityPressure * 0.35 + ctx.macroPropagationRisk * 0.25,
    );
    const recoveryProbability = this.policy.clampProb(
      continuityScore / 120 + corridorDurability / 200 - systemicContinuityRisk / 220 + memoryWeight / 400,
    );
    const economicSurvivalProbability = this.policy.clampProb(
      economicStability / 110 + dependencyDurability / 250 - instabilityRisk / 200,
    );

    const continuityStatus = this.toContinuityStatus(continuityScore, instabilityRisk);
    const severity = this.toSeverity(systemicContinuityRisk);

    return {
      continuityScore,
      corridorDurability,
      economicStability,
      instabilityRisk,
      continuityPressure,
      dependencyDurability,
      economicSurvivalProbability,
      recoveryProbability,
      systemicContinuityRisk,
      continuityStatus,
      severity,
      diagnostics: {
        computedFrom: [
          "macro_economic",
          "supply_flow",
          "geo_economic",
          "sector_intelligence",
          "strategic_memory",
          "command_center",
          "pressure_graph",
          "macro_snapshots",
          "propagation_history",
        ],
        incidentWeight,
        memoryWeight,
        macroStressWeight,
        macroFragilityWeight,
        propagationHistoryWeight,
        trendPenalty,
        supplyWeight,
        sectorWeight,
        geoWeight,
        pressureWeight,
        commandWeight,
        peerWeight,
        macroSnapshotCount: ctx.macroSnapshotCount,
        continuitySnapshotCount: ctx.continuitySnapshotCount,
        snapshotResilienceTrend: ctx.snapshotResilienceTrend,
        heuristicFallbackUsed: ctx.heuristicFallbackUsed,
        fallbackReasons: ctx.fallbackReasons,
      },
    };
  }

  private toContinuityStatus(
    continuity: number,
    instability: number,
  ): RelationalEconomicContinuityStatus {
    if (instability >= 78 || continuity <= 28) return RelationalEconomicContinuityStatus.CRITICAL;
    if (instability >= 62 || continuity <= 40) return RelationalEconomicContinuityStatus.UNSTABLE;
    if (instability >= 48 || continuity <= 52) return RelationalEconomicContinuityStatus.STRESSED;
    if (instability >= 35 || continuity <= 65) return RelationalEconomicContinuityStatus.WATCH;
    return RelationalEconomicContinuityStatus.STABLE;
  }

  private toSeverity(risk: number): RelationalEconomicStabilitySeverity {
    if (risk < 32) return RelationalEconomicStabilitySeverity.LOW;
    if (risk < 55) return RelationalEconomicStabilitySeverity.MEDIUM;
    if (risk < 78) return RelationalEconomicStabilitySeverity.HIGH;
    return RelationalEconomicStabilitySeverity.CRITICAL;
  }
}
