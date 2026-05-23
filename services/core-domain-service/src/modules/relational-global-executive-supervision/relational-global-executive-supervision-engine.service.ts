import { Injectable } from "@nestjs/common";
import {
  RelationalGlobalExecutiveSupervisionPriority,
  RelationalGlobalExecutiveSupervisionSeverity,
  RelationalGlobalExecutiveSupervisionStatus,
  RelationalGlobalExecutiveSupervisionType,
} from "@prisma/client";

import type { GlobalExecutiveSupervisionCorridorContext } from "./relational-global-executive-supervision-corridor-context.service";
import { RelationalGlobalExecutiveSupervisionBalanceService } from "./relational-global-executive-supervision-balance.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";
import { RelationalGlobalExecutiveSupervisionPriorityService } from "./relational-global-executive-supervision-priority.service";
import { RelationalGlobalExecutiveSupervisionRiskService } from "./relational-global-executive-supervision-risk.service";

export type ComputedGlobalExecutiveSupervisionState = {
  supervisionType: RelationalGlobalExecutiveSupervisionType;
  supervisionPriority: RelationalGlobalExecutiveSupervisionPriority;
  supervisionStatus: RelationalGlobalExecutiveSupervisionStatus;
  severity: RelationalGlobalExecutiveSupervisionSeverity;
  supervisionScore: number;
  executivePressure: number;
  systemicExposure: number;
  resilienceStrength: number;
  strategicAlignmentScore: number;
  governancePressure: number;
  arbitrationPressure: number;
  stabilizationPressure: number;
  monitoringPressure: number;
  orchestrationPressure: number;
  institutionalPressure: number;
  intelligencePressure: number;
  commandPressure: number;
  operationsPressure: number;
  controlRoomPressure: number;
  synthesisPressure: number;
  recoveryPressure: number;
  sovereigntyPressure: number;
  executiveUrgency: number;
  executiveEscalationDetected: boolean;
  systemicConcentrationDetected: boolean;
  supervisionPriorityDetected: boolean;
  resilienceDetected: boolean;
  globalCollapseRiskDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalGlobalExecutiveSupervisionEngineService {
  constructor(
    private readonly policy: RelationalGlobalExecutiveSupervisionPolicyService,
    private readonly prioritySvc: RelationalGlobalExecutiveSupervisionPriorityService,
    private readonly riskSvc: RelationalGlobalExecutiveSupervisionRiskService,
    private readonly balanceSvc: RelationalGlobalExecutiveSupervisionBalanceService,
  ) {}

  computeGlobalExecutiveSupervisionState(
    ctx: GlobalExecutiveSupervisionCorridorContext,
  ): ComputedGlobalExecutiveSupervisionState {
    const executivePressure = this.riskSvc.computeExecutivePressure(ctx);
    const systemicExposure = this.riskSvc.computeSystemicExposure(ctx);
    const resilienceStrength = this.computeResilienceStrength(ctx);
    const strategicAlignmentScore = this.computeStrategicAlignment(ctx);
    const supervisionScore = this.computeSupervisionScore(ctx, resilienceStrength, executivePressure);
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);

    const executiveEscalationDetected = this.detectExecutiveEscalation(ctx, executivePressure);
    const systemicConcentrationDetected = this.detectSystemicConcentration(ctx, systemicExposure);
    const supervisionPriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = resilienceStrength >= 60;
    const globalCollapseRiskDetected = this.detectGlobalCollapseRisk(ctx, supervisionScore, executivePressure);

    return {
      supervisionType: this.balanceSvc.resolveSupervisionType(ctx, executivePressure, systemicExposure),
      supervisionPriority: this.prioritySvc.toPriority(executiveUrgency),
      supervisionStatus: RelationalGlobalExecutiveSupervisionStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      supervisionScore,
      executivePressure,
      systemicExposure,
      resilienceStrength,
      strategicAlignmentScore,
      governancePressure: this.policy.clampInt(100 - ctx.activeGovernanceStability + ctx.topConflictPressure * 0.3),
      arbitrationPressure: this.policy.clampInt(ctx.topArbitrationScore),
      stabilizationPressure: this.policy.clampInt(ctx.topInstabilityPressure),
      monitoringPressure: this.policy.clampInt(ctx.topExecutivePressure),
      orchestrationPressure: this.policy.clampInt(ctx.topExecutiveCoordinationPressure),
      institutionalPressure: this.policy.clampInt(
        ctx.topInstitutionalScore * 0.5 + ctx.topInstitutionalExecutiveRisk * 0.5,
      ),
      intelligencePressure: this.policy.clampInt(
        ctx.topStrategicIntelligenceScore * 0.5 + ctx.topStrategicExecutiveConcentration * 0.5,
      ),
      commandPressure: this.policy.clampInt(
        ctx.topCommandScore * 0.5 + ctx.topCommandExecutiveConcentration * 0.5,
      ),
      operationsPressure: this.policy.clampInt(
        ctx.topOperationsScore * 0.5 + ctx.topOperationsExecutivePressure * 0.5,
      ),
      controlRoomPressure: this.policy.clampInt(
        ctx.topControlRoomScore * 0.5 + ctx.topControlRoomExecutivePressure * 0.5,
      ),
      synthesisPressure: this.policy.clampInt(
        ctx.topStrategicSynthesisScore * 0.5 + ctx.topStrategicSynthesisExecutiveExposure * 0.5,
      ),
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      executiveEscalationDetected,
      systemicConcentrationDetected,
      supervisionPriorityDetected,
      resilienceDetected,
      globalCollapseRiskDetected,
      diagnostics: {
        topStrategicSynthesisScore: ctx.topStrategicSynthesisScore,
        priorGlobalExecutiveSupervisionNodeCount: ctx.priorGlobalExecutiveSupervisionNodeCount,
      },
    };
  }

  computeSupervisionScore(ctx: GlobalExecutiveSupervisionCorridorContext, resilience: number, pressure: number): number {
    return this.policy.clampInt(
      resilience * 0.26 +
        (100 - pressure) * 0.26 +
        ctx.topStrategicSynthesisScore * 0.24 +
        ctx.topControlRoomScore * 0.24,
    );
  }

  computeResilienceStrength(ctx: GlobalExecutiveSupervisionCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicSynthesisScore * 0.35 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.3,
    );
  }

  computeStrategicAlignment(ctx: GlobalExecutiveSupervisionCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  detectExecutiveEscalation(ctx: GlobalExecutiveSupervisionCorridorContext, exposure: number): boolean {
    return exposure >= 72 && ctx.peerRelationshipCount >= 3;
  }

  detectSystemicConcentration(ctx: GlobalExecutiveSupervisionCorridorContext, pressure: number): boolean {
    return pressure >= 68 || ctx.topStrategicSynthesisExecutiveExposure >= 72;
  }

  detectGlobalCollapseRisk(
    ctx: GlobalExecutiveSupervisionCorridorContext,
    supervisionScore: number,
    exposure: number,
  ): boolean {
    return supervisionScore < 35 && exposure >= 75;
  }
}
