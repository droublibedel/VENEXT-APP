import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicRecoveryPriority,
  RelationalEconomicRecoverySeverity,
  RelationalEconomicRecoveryStatus,
  RelationalEconomicRecoveryStepType,
  RelationalEconomicRecoveryType,
} from "@prisma/client";

import type { EconomicRecoveryCorridorContext } from "./relational-economic-recovery-corridor-context.service";
import type { RecoveryDependencyDiagnostics } from "./relational-economic-recovery-dependency.service";
import { RelationalEconomicRecoveryDependencyService } from "./relational-economic-recovery-dependency.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";
import type { RecoveryPriorityResult } from "./relational-economic-recovery-priority.service";
import { RelationalEconomicRecoveryPriorityService } from "./relational-economic-recovery-priority.service";
import { RelationalEconomicRecoveryRiskService } from "./relational-economic-recovery-risk.service";

export type GeneratedRecoveryStep = {
  stepCode: string;
  stepOrder: number;
  stepType: RelationalEconomicRecoveryStepType;
  blocking: boolean;
  estimatedDuration: number;
  dependencyLevel: number;
  recoveryImpactScore: number;
  recoveryRiskScore: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
};

export type GeneratedRecoveryPlan = {
  recoveryType: RelationalEconomicRecoveryType;
  recoveryPriority: RelationalEconomicRecoveryPriority;
  recoveryStatus: RelationalEconomicRecoveryStatus;
  severity: RelationalEconomicRecoverySeverity;
  recoveryScore: number;
  instabilityScore: number;
  dependencyExposure: number;
  continuityPressure: number;
  sovereigntyPressure: number;
  corridorRecoveryProbability: number;
  estimatedRecoveryDuration: number;
  recoveryComplexity: number;
  interventionPriority: number;
  systemicImpactRisk: number;
  steps: GeneratedRecoveryStep[];
  diagnostics: Record<string, unknown>;
};

const STEP_SEQUENCE: RelationalEconomicRecoveryStepType[] = [
  RelationalEconomicRecoveryStepType.PRIORITY_STABILIZATION,
  RelationalEconomicRecoveryStepType.DEPENDENCY_REDUCTION,
  RelationalEconomicRecoveryStepType.FLOW_REBALANCING,
  RelationalEconomicRecoveryStepType.PRESSURE_CONTAINMENT,
  RelationalEconomicRecoveryStepType.CONTINUITY_RECOVERY,
  RelationalEconomicRecoveryStepType.SOVEREIGNTY_REINFORCEMENT,
  RelationalEconomicRecoveryStepType.SECTOR_REBALANCING,
  RelationalEconomicRecoveryStepType.TERRITORIAL_REALIGNMENT,
  RelationalEconomicRecoveryStepType.SYSTEMIC_RISK_CONTAINMENT,
  RelationalEconomicRecoveryStepType.RECOVERY_VALIDATION,
];

@Injectable()
export class RelationalEconomicRecoveryPlanningService {
  constructor(
    private readonly policy: RelationalEconomicRecoveryPolicyService,
    private readonly prioritySvc: RelationalEconomicRecoveryPriorityService,
    private readonly riskSvc: RelationalEconomicRecoveryRiskService,
    private readonly dependencySvc: RelationalEconomicRecoveryDependencyService,
  ) {}

  async generateRecoveryPlan(
    ctx: EconomicRecoveryCorridorContext,
    depMap?: RecoveryDependencyDiagnostics,
  ): Promise<GeneratedRecoveryPlan> {
    const priority = this.prioritySvc.computePriority(ctx);
    const risk = this.riskSvc.computeRecoveryRisk(ctx);
    const traversal = depMap ?? (await this.dependencySvc.buildRecoveryDependencyMap(ctx.relationshipId));

    const recoveryType = this.resolveRecoveryType(ctx, priority);
    const recoveryScore = this.computeRecoveryScore(ctx, priority);
    const dependencyExposure = this.policy.clampInt(ctx.dependencyExposureScore);
    const continuityPressure = this.policy.clampInt(
      (100 - ctx.continuityScore) * 0.6 + ctx.continuityInstability * 0.4,
    );
    const sovereigntyPressure = this.policy.clampInt(
      (100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5,
    );
    const corridorRecoveryProbability = this.computeRecoveryProbability(ctx, traversal);
    const recoveryComplexity = this.computeRecoveryComplexity(risk.recoveryComplexity, traversal);
    const estimatedRecoveryDuration = this.computeRecoveryDurationEstimate(recoveryComplexity, ctx);
    const interventionPriority = priority.interventionUrgency;

    const steps = this.generateRecoverySteps(ctx, priority, traversal, recoveryComplexity);

    return {
      recoveryType,
      recoveryPriority: priority.recoveryPriority,
      recoveryStatus: RelationalEconomicRecoveryStatus.ACTIVE,
      severity: priority.severity,
      recoveryScore,
      instabilityScore: risk.instabilityScore,
      dependencyExposure,
      continuityPressure,
      sovereigntyPressure,
      corridorRecoveryProbability,
      estimatedRecoveryDuration,
      recoveryComplexity,
      interventionPriority,
      systemicImpactRisk: risk.systemicImpactRisk,
      steps,
      diagnostics: {
        computedFrom: [
          "sovereignty",
          "continuity",
          "macro_economic",
          "supply_flow",
          "pressure_graph",
          "strategic_memory",
          "orchestration",
          "predictive_risk",
        ],
        priority,
        recoveryTraversal: {
          traversalDepth: traversal.traversalDepth,
          visitedNodes: traversal.visitedNodes,
          recoveryEdgeCount: traversal.recoveryEdgeCount,
          boundedTraversalApplied: traversal.boundedTraversalApplied,
          recoveryComplexity: traversal.recoveryChains.length,
        },
        heuristicFallbackUsed: ctx.heuristicFallbackUsed,
        fallbackReasons: ctx.fallbackReasons,
        nonAutopilot: true,
        planningOnly: true,
      },
    };
  }

  generateRecoverySteps(
    ctx: EconomicRecoveryCorridorContext,
    priority: RecoveryPriorityResult,
    traversal: RecoveryDependencyDiagnostics,
    recoveryComplexity: number,
  ): GeneratedRecoveryStep[] {
    const confidence: "LOW" | "MEDIUM" | "HIGH" = ctx.heuristicFallbackUsed
      ? "LOW"
      : priority.recoveryPriorityScore >= 62
        ? "MEDIUM"
        : "HIGH";

    return STEP_SEQUENCE.map((stepType, index) => {
      const order = index + 1;
      const baseImpact = this.policy.clampInt(100 - order * 6 + priority.recoveryPriorityScore * 0.15);
      const baseRisk = this.policy.clampInt(recoveryComplexity * 0.4 + order * 4);
      return {
        stepCode: `RECOVERY_STEP:${ctx.relationshipId}:${stepType}`,
        stepOrder: order,
        stepType,
        blocking: order <= 2 || stepType === RelationalEconomicRecoveryStepType.PRIORITY_STABILIZATION,
        estimatedDuration: this.policy.clampInt(2 + order + Math.floor(recoveryComplexity / 25)),
        dependencyLevel: this.policy.clampInt(traversal.recoveryEdgeCount / 4 + order * 3),
        recoveryImpactScore: baseImpact,
        recoveryRiskScore: baseRisk,
        confidenceLevel: confidence,
      };
    });
  }

  computeRecoveryProbability(
    ctx: EconomicRecoveryCorridorContext,
    traversal: RecoveryDependencyDiagnostics,
  ): number {
    return this.policy.clampProb(
      ctx.corridorSelfRecoveryProbability * 0.55 +
        ctx.continuityScore / 220 +
        (1 - traversal.traversalDepth / 40) * 0.2 -
        traversal.recoveryBottlenecks.length / 80,
    );
  }

  computeRecoveryComplexity(
    baseComplexity: number,
    traversal: RecoveryDependencyDiagnostics,
  ): number {
    return this.policy.clampInt(
      baseComplexity * 0.6 + traversal.recoveryEdgeCount * 1.5 + traversal.traversalDepth * 5,
    );
  }

  computeRecoveryDurationEstimate(complexity: number, ctx: EconomicRecoveryCorridorContext): number {
    return Math.max(1, Math.min(365, Math.round(complexity / 8 + ctx.priorRecoveryPlanCount * 2 + 7)));
  }

  computeRecoveryDependencies(traversal: RecoveryDependencyDiagnostics): Record<string, unknown> {
    return {
      chains: traversal.recoveryChains.length,
      bottlenecks: traversal.recoveryBottlenecks,
      blockers: traversal.recoveryBlockers,
    };
  }

  computeRecoveryPriority(ctx: EconomicRecoveryCorridorContext): RecoveryPriorityResult {
    return this.prioritySvc.computePriority(ctx);
  }

  computeRecoveryRisk(ctx: EconomicRecoveryCorridorContext) {
    return this.riskSvc.computeRecoveryRisk(ctx);
  }

  private computeRecoveryScore(ctx: EconomicRecoveryCorridorContext, priority: RecoveryPriorityResult): number {
    return this.policy.clampInt(
      ctx.sovereigntyScore * 0.35 +
        ctx.continuityScore * 0.25 +
        (100 - priority.recoveryPriorityScore) * 0.2 +
        ctx.corridorSelfRecoveryProbability * 100 * 0.2,
    );
  }

  private resolveRecoveryType(
    ctx: EconomicRecoveryCorridorContext,
    priority: RecoveryPriorityResult,
  ): RelationalEconomicRecoveryType {
    if (ctx.systemicAutonomyRisk >= 72 || priority.recoveryPriorityScore >= 78) {
      return RelationalEconomicRecoveryType.SYSTEMIC_CONTAINMENT;
    }
    if (ctx.autonomyScore <= 45 || ctx.strategicCaptivityRisk >= 65) {
      return RelationalEconomicRecoveryType.SOVEREIGNTY_REINFORCEMENT;
    }
    if (ctx.continuityScore <= 48 || ctx.continuityInstability >= 60) {
      return RelationalEconomicRecoveryType.CONTINUITY_RESTORATION;
    }
    if (ctx.dependencyExposureScore >= 58 || ctx.macroDependencyCount >= 4) {
      return RelationalEconomicRecoveryType.DEPENDENCY_REMEDIATION;
    }
    return RelationalEconomicRecoveryType.CORRIDOR_STABILIZATION;
  }
}
