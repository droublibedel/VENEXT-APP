import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicIntelligencePriority,
  RelationalStrategicIntelligenceSeverity,
  RelationalStrategicIntelligenceStatus,
  RelationalStrategicIntelligenceType,
} from "@prisma/client";

import type { StrategicIntelligenceCorridorContext } from "./relational-strategic-intelligence-corridor-context.service";
import { RelationalStrategicIntelligenceBalanceService } from "./relational-strategic-intelligence-balance.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";
import { RelationalStrategicIntelligencePriorityService } from "./relational-strategic-intelligence-priority.service";
import { RelationalStrategicIntelligenceRiskService } from "./relational-strategic-intelligence-risk.service";

export type ComputedStrategicIntelligenceState = {
  intelligenceType: RelationalStrategicIntelligenceType;
  intelligencePriority: RelationalStrategicIntelligencePriority;
  intelligenceStatus: RelationalStrategicIntelligenceStatus;
  severity: RelationalStrategicIntelligenceSeverity;
  strategicIntelligenceScore: number;
  executiveExposure: number;
  resilienceStrength: number;
  systemicConcentration: number;
  strategicAlignmentScore: number;
  governancePressure: number;
  arbitrationPressure: number;
  stabilizationPressure: number;
  monitoringPressure: number;
  orchestrationPressure: number;
  institutionalPressure: number;
  recoveryPressure: number;
  sovereigntyPressure: number;
  executiveUrgency: number;
  systemicPressureDetected: boolean;
  executiveExposureDetected: boolean;
  strategicPriorityDetected: boolean;
  resilienceDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalStrategicIntelligenceEngineService {
  constructor(
    private readonly policy: RelationalStrategicIntelligencePolicyService,
    private readonly prioritySvc: RelationalStrategicIntelligencePriorityService,
    private readonly riskSvc: RelationalStrategicIntelligenceRiskService,
    private readonly balanceSvc: RelationalStrategicIntelligenceBalanceService,
  ) {}

  computeStrategicIntelligenceState(ctx: StrategicIntelligenceCorridorContext): ComputedStrategicIntelligenceState {
    const executiveExposure = this.riskSvc.computeExecutiveExposure(ctx);
    const systemicConcentration = this.riskSvc.computeSystemicConcentration(ctx);
    const resilienceStrength = this.computeResilienceStrength(ctx);
    const strategicAlignmentScore = this.computeStrategicAlignment(ctx);
    const strategicIntelligenceScore = this.computeStrategicIntelligenceScore(ctx, resilienceStrength, systemicConcentration);
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);

    const systemicPressureDetected = this.detectSystemicPressure(ctx, systemicConcentration);
    const executiveExposureDetected = this.detectExecutiveExposure(ctx, executiveExposure);
    const strategicPriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = resilienceStrength >= 60;

    return {
      intelligenceType: this.balanceSvc.resolveIntelligenceType(ctx, systemicConcentration, executiveExposure),
      intelligencePriority: this.prioritySvc.toPriority(executiveUrgency),
      intelligenceStatus: RelationalStrategicIntelligenceStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      strategicIntelligenceScore,
      executiveExposure,
      resilienceStrength,
      systemicConcentration,
      strategicAlignmentScore,
      governancePressure: this.policy.clampInt(100 - ctx.activeGovernanceStability + ctx.topConflictPressure * 0.3),
      arbitrationPressure: this.policy.clampInt(ctx.topArbitrationScore),
      stabilizationPressure: this.policy.clampInt(ctx.topInstabilityPressure),
      monitoringPressure: this.policy.clampInt(ctx.topExecutivePressure),
      orchestrationPressure: this.policy.clampInt(ctx.topInstitutionalExecutiveRisk),
      institutionalPressure: this.policy.clampInt(
        ctx.topInstitutionalScore * 0.4 + (100 - ctx.activeGovernanceStability) * 0.3 + executiveExposure * 0.3,
      ),
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      systemicPressureDetected,
      executiveExposureDetected,
      strategicPriorityDetected,
      resilienceDetected,
      diagnostics: {
        topInstitutionalScore: ctx.topInstitutionalScore,
        priorStrategicIntelligenceNodeCount: ctx.priorStrategicIntelligenceNodeCount,
      },
    };
  }

  computeStrategicIntelligenceScore(
    ctx: StrategicIntelligenceCorridorContext,
    resilience: number,
    exposure: number,
  ): number {
    return this.policy.clampInt(
      resilience * 0.3 +
        (100 - exposure) * 0.25 +
        ctx.topInstitutionalScore * 0.25 +
        ctx.topMonitoringScore * 0.2,
    );
  }

  computeResilienceStrength(ctx: StrategicIntelligenceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topInstitutionalScore * 0.3 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.35,
    );
  }

  computeStrategicAlignment(ctx: StrategicIntelligenceCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  detectSystemicPressure(ctx: StrategicIntelligenceCorridorContext, exposure: number): boolean {
    return exposure >= 70 && ctx.peerRelationshipCount >= 3;
  }

  detectExecutiveExposure(ctx: StrategicIntelligenceCorridorContext, risk: number): boolean {
    return risk >= 68 || ctx.topInstitutionalExecutiveRisk >= 72;
  }
}
