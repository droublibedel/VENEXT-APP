import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveOrchestrationPriority,
  RelationalExecutiveOrchestrationSeverity,
  RelationalExecutiveOrchestrationStatus,
  RelationalExecutiveOrchestrationType,
} from "@prisma/client";

import type { ExecutiveOrchestrationCorridorContext } from "./relational-executive-orchestration-corridor-context.service";
import { RelationalExecutiveOrchestrationBalanceService } from "./relational-executive-orchestration-balance.service";
import { RelationalExecutiveOrchestrationPolicyService } from "./relational-executive-orchestration-policy.service";
import { RelationalExecutiveOrchestrationPriorityService } from "./relational-executive-orchestration-priority.service";
import { RelationalExecutiveOrchestrationRiskService } from "./relational-executive-orchestration-risk.service";

export type ComputedExecutiveOrchestrationState = {
  orchestrationType: RelationalExecutiveOrchestrationType;
  orchestrationPriority: RelationalExecutiveOrchestrationPriority;
  orchestrationStatus: RelationalExecutiveOrchestrationStatus;
  severity: RelationalExecutiveOrchestrationSeverity;
  orchestrationScore: number;
  executiveCoordinationPressure: number;
  systemicExposure: number;
  executiveResilience: number;
  strategicAlignmentScore: number;
  governancePressure: number;
  arbitrationPressure: number;
  stabilizationPressure: number;
  monitoringPressure: number;
  recoveryPressure: number;
  sovereigntyPressure: number;
  dependencyPressure: number;
  executiveUrgency: number;
  executiveInstabilityDetected: boolean;
  coordinationBreakdownDetected: boolean;
  systemicConcentrationDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalExecutiveOrchestrationEngineService {
  constructor(
    private readonly policy: RelationalExecutiveOrchestrationPolicyService,
    private readonly prioritySvc: RelationalExecutiveOrchestrationPriorityService,
    private readonly riskSvc: RelationalExecutiveOrchestrationRiskService,
    private readonly balanceSvc: RelationalExecutiveOrchestrationBalanceService,
  ) {}

  computeExecutiveOrchestrationState(ctx: ExecutiveOrchestrationCorridorContext): ComputedExecutiveOrchestrationState {
    const executiveCoordinationPressure = this.computeExecutiveCoordinationPressure(ctx);
    const systemicExposure = this.computeSystemicExposure(ctx);
    const executiveResilience = this.computeExecutiveResilience(ctx);
    const strategicAlignmentScore = this.computeStrategicAlignment(ctx);
    const orchestrationScore = this.computeOrchestrationScore(ctx, executiveResilience, systemicExposure);
    const executiveUrgency = this.computeExecutivePriority(ctx);

    const executiveInstabilityDetected = this.detectExecutiveInstability(ctx, executiveCoordinationPressure);
    const coordinationBreakdownDetected = this.detectCoordinationBreakdown(ctx, executiveCoordinationPressure);
    const systemicConcentrationDetected = this.detectSystemicConcentration(ctx, systemicExposure);

    return {
      orchestrationType: this.balanceSvc.resolveOrchestrationType(
        ctx,
        systemicExposure,
        executiveCoordinationPressure,
      ),
      orchestrationPriority: this.prioritySvc.toPriority(executiveUrgency),
      orchestrationStatus: RelationalExecutiveOrchestrationStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      orchestrationScore,
      executiveCoordinationPressure,
      systemicExposure,
      executiveResilience,
      strategicAlignmentScore,
      governancePressure: this.policy.clampInt(100 - ctx.activeGovernanceStability + ctx.topConflictPressure * 0.3),
      arbitrationPressure: this.policy.clampInt(ctx.topArbitrationScore),
      stabilizationPressure: this.policy.clampInt(ctx.topInstabilityPressure),
      monitoringPressure: this.policy.clampInt(ctx.topExecutivePressure),
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      dependencyPressure: this.policy.clampInt(ctx.dependencyExposureScore),
      executiveUrgency,
      executiveInstabilityDetected,
      coordinationBreakdownDetected,
      systemicConcentrationDetected,
      diagnostics: {
        topMonitoringScore: ctx.topMonitoringScore,
        peerRelationshipCount: ctx.peerRelationshipCount,
      },
    };
  }

  computeOrchestrationScore(ctx: ExecutiveOrchestrationCorridorContext, resilience: number, exposure: number): number {
    return this.policy.clampInt(
      resilience * 0.35 + (100 - exposure) * 0.3 + ctx.topMonitoringScore * 0.2 + ctx.topStabilizationScore * 0.15,
    );
  }

  computeExecutiveCoordinationPressure(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.policy.clampInt(
      ctx.topExecutivePressure * 0.35 +
        ctx.topInstabilityPressure * 0.25 +
        ctx.orchestrationOpenCount * 8 +
        ctx.governanceConflictCount * 7,
    );
  }

  computeSystemicExposure(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.riskSvc.computeSystemicExposure(ctx);
  }

  computeExecutiveResilience(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.policy.clampInt(
      ctx.topMonitoringScore * 0.35 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.3,
    );
  }

  computeStrategicAlignment(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  computeExecutivePriority(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.prioritySvc.computeExecutivePriority(ctx);
  }

  detectExecutiveInstability(ctx: ExecutiveOrchestrationCorridorContext, pressure: number): boolean {
    return pressure >= 68 || ctx.topInstabilityPressure >= 72;
  }

  detectCoordinationBreakdown(ctx: ExecutiveOrchestrationCorridorContext, pressure: number): boolean {
    return pressure >= 62 && ctx.governanceConflictCount >= 2;
  }

  detectSystemicConcentration(ctx: ExecutiveOrchestrationCorridorContext, exposure: number): boolean {
    return exposure >= 70 && ctx.peerRelationshipCount >= 3;
  }
}
