import { Injectable } from "@nestjs/common";
import {
  RelationalInstitutionalReportingPriority,
  RelationalInstitutionalReportingSeverity,
  RelationalInstitutionalReportingStatus,
  RelationalInstitutionalReportingType,
} from "@prisma/client";

import type { InstitutionalReportingCorridorContext } from "./relational-institutional-reporting-corridor-context.service";
import { RelationalInstitutionalReportingBalanceService } from "./relational-institutional-reporting-balance.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";
import { RelationalInstitutionalReportingPriorityService } from "./relational-institutional-reporting-priority.service";
import { RelationalInstitutionalReportingRiskService } from "./relational-institutional-reporting-risk.service";

export type ComputedInstitutionalReportingState = {
  reportingType: RelationalInstitutionalReportingType;
  reportingPriority: RelationalInstitutionalReportingPriority;
  reportingStatus: RelationalInstitutionalReportingStatus;
  severity: RelationalInstitutionalReportingSeverity;
  institutionalScore: number;
  executiveRisk: number;
  strategicResilience: number;
  systemicExposure: number;
  strategicAlignmentScore: number;
  governancePressure: number;
  arbitrationPressure: number;
  stabilizationPressure: number;
  monitoringPressure: number;
  orchestrationPressure: number;
  recoveryPressure: number;
  sovereigntyPressure: number;
  executiveUrgency: number;
  systemicRiskDetected: boolean;
  executivePressureDetected: boolean;
  institutionalPriorityDetected: boolean;
  resilienceDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalInstitutionalReportingEngineService {
  constructor(
    private readonly policy: RelationalInstitutionalReportingPolicyService,
    private readonly prioritySvc: RelationalInstitutionalReportingPriorityService,
    private readonly riskSvc: RelationalInstitutionalReportingRiskService,
    private readonly balanceSvc: RelationalInstitutionalReportingBalanceService,
  ) {}

  computeInstitutionalReportingState(ctx: InstitutionalReportingCorridorContext): ComputedInstitutionalReportingState {
    const executiveRisk = this.riskSvc.computeExecutiveRisk(ctx);
    const systemicExposure = this.riskSvc.computeSystemicExposure(ctx);
    const strategicResilience = this.computeStrategicResilience(ctx);
    const strategicAlignmentScore = this.computeStrategicAlignment(ctx);
    const institutionalScore = this.computeInstitutionalScore(ctx, strategicResilience, systemicExposure);
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);

    const systemicRiskDetected = this.detectSystemicRisk(ctx, systemicExposure);
    const executivePressureDetected = this.detectExecutivePressure(ctx, executiveRisk);
    const institutionalPriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = strategicResilience >= 60;

    return {
      reportingType: this.balanceSvc.resolveReportingType(ctx, systemicExposure, executiveRisk),
      reportingPriority: this.prioritySvc.toPriority(executiveUrgency),
      reportingStatus: RelationalInstitutionalReportingStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      institutionalScore,
      executiveRisk,
      strategicResilience,
      systemicExposure,
      strategicAlignmentScore,
      governancePressure: this.policy.clampInt(100 - ctx.activeGovernanceStability + ctx.topConflictPressure * 0.3),
      arbitrationPressure: this.policy.clampInt(ctx.topArbitrationScore),
      stabilizationPressure: this.policy.clampInt(ctx.topInstabilityPressure),
      monitoringPressure: this.policy.clampInt(ctx.topExecutivePressure),
      orchestrationPressure: this.policy.clampInt(ctx.topExecutiveCoordinationPressure),
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      systemicRiskDetected,
      executivePressureDetected,
      institutionalPriorityDetected,
      resilienceDetected,
      diagnostics: {
        topOrchestrationScore: ctx.topOrchestrationScore,
        priorInstitutionalReportingNodeCount: ctx.priorInstitutionalReportingNodeCount,
      },
    };
  }

  computeInstitutionalScore(
    ctx: InstitutionalReportingCorridorContext,
    resilience: number,
    exposure: number,
  ): number {
    return this.policy.clampInt(
      resilience * 0.3 +
        (100 - exposure) * 0.25 +
        ctx.topOrchestrationScore * 0.25 +
        ctx.topMonitoringScore * 0.2,
    );
  }

  computeStrategicResilience(ctx: InstitutionalReportingCorridorContext): number {
    return this.policy.clampInt(
      ctx.topOrchestrationScore * 0.3 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.35,
    );
  }

  computeStrategicAlignment(ctx: InstitutionalReportingCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  detectSystemicRisk(ctx: InstitutionalReportingCorridorContext, exposure: number): boolean {
    return exposure >= 70 && ctx.peerRelationshipCount >= 3;
  }

  detectExecutivePressure(ctx: InstitutionalReportingCorridorContext, risk: number): boolean {
    return risk >= 68 || ctx.topExecutiveCoordinationPressure >= 72;
  }
}
