import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicAutonomyStatus,
  RelationalEconomicDependencyExposure,
  RelationalEconomicSovereigntySeverity,
} from "@prisma/client";

import type { EconomicSovereigntyCorridorContext } from "./relational-economic-sovereignty-corridor-context.service";
import {
  RelationalEconomicSovereigntyCalibrationService,
  SOVEREIGNTY_CALIBRATION_V1,
} from "./relational-economic-sovereignty-calibration.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";

export type SovereigntyAutonomyScores = {
  sovereigntyScore: number;
  autonomyScore: number;
  dependencyConcentration: number;
  externalDependencyExposure: number;
  resilienceAutonomy: number;
  recoveryAutonomy: number;
  strategicCaptivityRisk: number;
  corridorSelfRecoveryProbability: number;
  dependencyCriticality: number;
  systemicAutonomyRisk: number;
  dependencyExposureScore: number;
  dependencyExposureLevel: RelationalEconomicDependencyExposure;
  autonomyStatus: RelationalEconomicAutonomyStatus;
  severity: RelationalEconomicSovereigntySeverity;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalEconomicSovereigntyAutonomyService {
  constructor(
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly calibration: RelationalEconomicSovereigntyCalibrationService,
  ) {}

  computeAutonomy(ctx: EconomicSovereigntyCorridorContext): SovereigntyAutonomyScores {
    const cal = this.calibration.getCalibration();
    const w = cal.autonomyWeights;

    const incidentWeight = Math.min(100, ctx.openIncidentCount * w.incidentPerPoint);
    const memoryWeight =
      ctx.strategicMemoryActiveCount === 0
        ? 0
        : Math.min(100, ctx.strategicMemoryActiveCount * w.memoryPerPoint);
    const macroFragility = ctx.macroStructuralFragility;
    const continuityInstability = ctx.continuityInstability;
    const supplyWeight = ctx.supplyFlowDisruptionAvg;
    const peerWeight = Math.min(100, ctx.peerPressureEdgeCount * w.peerMultiplier);
    const macroDepWeight = Math.min(100, ctx.macroDependencyCount * w.macroDepMultiplier);
    const supplyEdgeWeight = Math.min(100, ctx.supplyFlowEdgeCount * w.supplyEdgeMultiplier);
    const orchestrationWeight = Math.min(100, ctx.orchestrationOpenCount * w.orchestrationPerPoint);
    const pressureWeight = ctx.pressureScore;

    const dc = w.dependencyConcentration;
    const dependencyConcentration = this.policy.clampInt(
      macroDepWeight * dc.macroDep + supplyEdgeWeight * dc.supplyEdge + peerWeight * dc.peer + pressureWeight * dc.pressure,
    );
    const ed = w.externalDependency;
    const externalDependencyExposure = this.policy.clampInt(
      supplyWeight * ed.supply +
        macroFragility * ed.macroFragility +
        continuityInstability * ed.continuityInstability +
        orchestrationWeight * ed.orchestration,
    );
    const dk = w.dependencyCriticality;
    const dependencyCriticality = this.policy.clampInt(
      dependencyConcentration * dk.concentration +
        externalDependencyExposure * dk.external +
        incidentWeight * dk.incident,
    );
    const as = w.autonomyScore;
    const autonomyScore = this.policy.clampInt(
      ctx.continuityScore * as.continuity +
        ctx.macroResilienceScore * as.macroResilience +
        memoryWeight * as.memory +
        (100 - dependencyConcentration) * as.lowDepConc +
        (100 - externalDependencyExposure) * as.lowExtDep,
    );
    const ra = w.resilienceAutonomy;
    const resilienceAutonomy = this.policy.clampInt(
      autonomyScore * ra.autonomy +
        (100 - continuityInstability) * ra.continuityStability +
        (100 - macroFragility) * ra.macroStability +
        memoryWeight * ra.memory,
    );
    const rec = w.recoveryAutonomy;
    const recoveryAutonomy = this.policy.clampInt(
      resilienceAutonomy * rec.resilience +
        ctx.continuityRecoveryProbability * 100 * rec.continuityRecovery +
        (100 - dependencyCriticality) * rec.lowCriticality,
    );
    const sc = w.strategicCaptivity;
    const strategicCaptivityRisk = this.policy.clampInt(
      dependencyConcentration * sc.concentration +
        externalDependencyExposure * sc.external +
        (100 - autonomyScore) * sc.lowAutonomy,
    );
    const sr = w.systemicRisk;
    const systemicAutonomyRisk = this.policy.clampInt(
      strategicCaptivityRisk * sr.captivity +
        ctx.macroPropagationRisk * sr.macroPropagation +
        orchestrationWeight * sr.orchestration,
    );
    const ss = w.sovereigntyScore;
    const sovereigntyScore = this.policy.clampInt(
      autonomyScore * ss.autonomy + resilienceAutonomy * ss.resilience + (100 - systemicAutonomyRisk) * ss.lowSystemicRisk,
    );
    const sr2 = w.selfRecovery;
    const corridorSelfRecoveryProbability = this.policy.clampProb(
      sovereigntyScore * sr2.sovereignty +
        recoveryAutonomy * sr2.recovery +
        ctx.continuityRecoveryProbability * sr2.continuityRecovery -
        systemicAutonomyRisk * sr2.systemicPenalty,
    );
    const eb = w.exposureBlend;
    const dependencyExposureScore = this.policy.clampInt(
      dependencyConcentration * eb.concentration + externalDependencyExposure * eb.external,
    );
    const dependencyExposureLevel = this.toExposureLevel(dependencyExposureScore);
    const autonomyStatus = this.toAutonomyStatus(autonomyScore, strategicCaptivityRisk);
    const severity = this.toSeverity(systemicAutonomyRisk);

    const sourceCounts = 8;
    const confidenceLevel = this.calibration.confidenceLevel({
      heuristicFallbackUsed: ctx.heuristicFallbackUsed,
      sourceCounts,
      calibrationProfile: cal.profile,
    });

    return {
      sovereigntyScore,
      autonomyScore,
      dependencyConcentration,
      externalDependencyExposure,
      resilienceAutonomy,
      recoveryAutonomy,
      strategicCaptivityRisk,
      corridorSelfRecoveryProbability,
      dependencyCriticality,
      systemicAutonomyRisk,
      dependencyExposureScore,
      dependencyExposureLevel,
      autonomyStatus,
      severity,
      diagnostics: {
        computedFrom: [
          "continuity",
          "macro_economic",
          "supply_flow",
          "pressure_graph",
          "strategic_memory",
          "orchestration",
          "macro_dependencies",
          "supply_flow_edges",
        ],
        calibrationVersion: SOVEREIGNTY_CALIBRATION_V1,
        calibrationProfile: cal.profile,
        weightsUsed: this.calibration.buildScoreContributors(w),
        scoreContributors: {
          incidentWeight,
          memoryWeight,
          macroDepWeight,
          supplyEdgeWeight,
          peerWeight,
          orchestrationWeight,
          pressureWeight,
        },
        confidenceLevel,
        incidentWeight,
        memoryWeight,
        macroFragility,
        continuityInstability,
        supplyWeight,
        peerWeight,
        macroDepWeight,
        supplyEdgeWeight,
        orchestrationWeight,
        pressureWeight,
        heuristicFallbackUsed: ctx.heuristicFallbackUsed,
        fallbackReasons: ctx.fallbackReasons,
        corridorSelfRecoveryProbability,
      },
    };
  }

  private toExposureLevel(score: number): RelationalEconomicDependencyExposure {
    if (score < 25) return RelationalEconomicDependencyExposure.MINIMAL;
    if (score < 45) return RelationalEconomicDependencyExposure.MODERATE;
    if (score < 65) return RelationalEconomicDependencyExposure.ELEVATED;
    if (score < 82) return RelationalEconomicDependencyExposure.CRITICAL;
    return RelationalEconomicDependencyExposure.SYSTEMIC;
  }

  private toAutonomyStatus(
    autonomy: number,
    captivity: number,
  ): RelationalEconomicAutonomyStatus {
    if (captivity >= 78 || autonomy <= 25) return RelationalEconomicAutonomyStatus.CRITICAL;
    if (captivity >= 62 || autonomy <= 38) return RelationalEconomicAutonomyStatus.CAPTIVE;
    if (captivity >= 48 || autonomy <= 52) return RelationalEconomicAutonomyStatus.DEPENDENT;
    if (autonomy >= 72 && captivity < 35) return RelationalEconomicAutonomyStatus.SOVEREIGN;
    return RelationalEconomicAutonomyStatus.BALANCED;
  }

  private toSeverity(risk: number): RelationalEconomicSovereigntySeverity {
    if (risk < 32) return RelationalEconomicSovereigntySeverity.LOW;
    if (risk < 55) return RelationalEconomicSovereigntySeverity.MEDIUM;
    if (risk < 78) return RelationalEconomicSovereigntySeverity.HIGH;
    return RelationalEconomicSovereigntySeverity.CRITICAL;
  }
}
