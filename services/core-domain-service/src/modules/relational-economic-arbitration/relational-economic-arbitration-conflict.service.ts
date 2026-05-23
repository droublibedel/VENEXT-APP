import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicArbitrationPriority,
  RelationalEconomicArbitrationSeverity,
  RelationalEconomicArbitrationStatus,
  RelationalEconomicArbitrationType,
} from "@prisma/client";

import type { EconomicArbitrationCorridorContext, GovernanceConflictRef } from "./relational-economic-arbitration-corridor-context.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";
import { RelationalEconomicArbitrationPriorityService } from "./relational-economic-arbitration-priority.service";
import { RelationalEconomicArbitrationRiskService } from "./relational-economic-arbitration-risk.service";

export type ArbitrationCandidate = {
  governanceConflictId: string | null;
  conflictType: string;
  arbitrationType: RelationalEconomicArbitrationType;
  arbitrationPriority: RelationalEconomicArbitrationPriority;
  arbitrationStatus: RelationalEconomicArbitrationStatus;
  severity: RelationalEconomicArbitrationSeverity;
  arbitrationScore: number;
  conflictSeverity: number;
  systemicImpact: number;
  dependencyPressure: number;
  continuityPressure: number;
  sovereigntyPressure: number;
  propagationPressure: number;
  coordinationPressure: number;
  resolutionComplexity: number;
  resolutionProbability: number;
  interventionUrgency: number;
};

@Injectable()
export class RelationalEconomicArbitrationConflictService {
  constructor(
    private readonly policy: RelationalEconomicArbitrationPolicyService,
    private readonly prioritySvc: RelationalEconomicArbitrationPriorityService,
    private readonly riskSvc: RelationalEconomicArbitrationRiskService,
  ) {}

  detectArbitrationCandidates(ctx: EconomicArbitrationCorridorContext): ArbitrationCandidate[] {
    const conflicts = ctx.governanceConflicts;
    if (conflicts.length === 0) {
      return [this.buildSyntheticCandidate(ctx, null)];
    }
    return conflicts.slice(0, 8).map((c) => this.buildCandidate(ctx, c));
  }

  computeConflictPressure(conflict: GovernanceConflictRef): number {
    return this.policy.clampInt(conflict.conflictPressure);
  }

  computeConflictPriority(conflict: GovernanceConflictRef, ctx: EconomicArbitrationCorridorContext): number {
    return this.prioritySvc.computeConflictPriority(conflict, ctx);
  }

  computeSystemicImpact(ctx: EconomicArbitrationCorridorContext, conflict?: GovernanceConflictRef): number {
    return this.riskSvc.computeSystemicImpact(ctx, conflict);
  }

  computeResolutionComplexity(conflict: GovernanceConflictRef): number {
    return this.policy.clampInt(conflict.estimatedResolutionComplexity);
  }

  computeResolutionProbability(ctx: EconomicArbitrationCorridorContext, complexity: number): number {
    return this.policy.clampProb(
      ctx.corridorSelfRecoveryProbability * 0.6 + (100 - complexity) / 100 * 0.4,
    );
  }

  computeResolutionRisk(ctx: EconomicArbitrationCorridorContext, conflict?: GovernanceConflictRef): number {
    return this.riskSvc.computeResolutionRisk(ctx, conflict);
  }

  private buildCandidate(ctx: EconomicArbitrationCorridorContext, conflict: GovernanceConflictRef): ArbitrationCandidate {
    const priorityScore = this.prioritySvc.computeConflictPriority(conflict, ctx);
    const complexity = this.computeResolutionComplexity(conflict);
    const systemicImpact = this.computeSystemicImpact(ctx, conflict);
    return {
      governanceConflictId: conflict.id,
      conflictType: conflict.conflictType,
      arbitrationType: this.resolveArbitrationType(conflict.conflictType),
      arbitrationPriority: this.prioritySvc.toPriority(priorityScore),
      arbitrationStatus: RelationalEconomicArbitrationStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(priorityScore),
      arbitrationScore: this.policy.clampInt(priorityScore * 0.7 + (100 - complexity) * 0.3),
      conflictSeverity: this.policy.clampInt(conflict.conflictPressure),
      systemicImpact,
      dependencyPressure: this.policy.clampInt(ctx.dependencyExposureScore),
      continuityPressure: this.policy.clampInt((100 - ctx.continuityScore) * 0.6 + ctx.continuityInstability * 0.4),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      propagationPressure: this.policy.clampInt(ctx.macroPropagationRisk),
      coordinationPressure: this.policy.clampInt(ctx.orchestrationOpenCount * 10),
      resolutionComplexity: complexity,
      resolutionProbability: this.computeResolutionProbability(ctx, complexity),
      interventionUrgency: this.policy.clampInt(priorityScore + ctx.activeRecoveryInterventionPriority * 0.2),
    };
  }

  private buildSyntheticCandidate(
    ctx: EconomicArbitrationCorridorContext,
    conflict: GovernanceConflictRef | null,
  ): ArbitrationCandidate {
    const priorityScore = this.policy.clampInt(
      ctx.activeRecoveryInterventionPriority + ctx.topConflictPressure * 0.3,
    );
    const complexity = this.policy.clampInt(40 + ctx.governanceConflictCount * 5);
    return {
      governanceConflictId: conflict?.id ?? null,
      conflictType: conflict?.conflictType ?? "NETWORK_TENSION",
      arbitrationType: RelationalEconomicArbitrationType.STRATEGIC_ARBITRATION,
      arbitrationPriority: this.prioritySvc.toPriority(priorityScore),
      arbitrationStatus: RelationalEconomicArbitrationStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(priorityScore),
      arbitrationScore: priorityScore,
      conflictSeverity: ctx.topConflictPressure,
      systemicImpact: this.computeSystemicImpact(ctx),
      dependencyPressure: this.policy.clampInt(ctx.dependencyExposureScore),
      continuityPressure: this.policy.clampInt(100 - ctx.continuityScore),
      sovereigntyPressure: this.policy.clampInt(100 - ctx.autonomyScore),
      propagationPressure: this.policy.clampInt(ctx.macroPropagationRisk),
      coordinationPressure: this.policy.clampInt(ctx.peerRelationshipCount * 3),
      resolutionComplexity: complexity,
      resolutionProbability: this.computeResolutionProbability(ctx, complexity),
      interventionUrgency: priorityScore,
    };
  }

  private resolveArbitrationType(conflictType: string): RelationalEconomicArbitrationType {
    if (conflictType.includes("RECOVERY")) return RelationalEconomicArbitrationType.CONFLICT_RESOLUTION;
    if (conflictType.includes("COORDINATION")) return RelationalEconomicArbitrationType.MULTI_CORRIDOR_PRIORITY;
    if (conflictType.includes("SYSTEMIC") || conflictType.includes("PROPAGATION")) {
      return RelationalEconomicArbitrationType.SYSTEMIC_STABILIZATION;
    }
    return RelationalEconomicArbitrationType.STRATEGIC_ARBITRATION;
  }
}
