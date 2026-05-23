import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicObservatoryPriority,
  RelationalStrategicObservatorySeverity,
  RelationalStrategicObservatoryStatus,
  RelationalStrategicObservatoryType,
} from "@prisma/client";

import type { StrategicObservatoryCorridorContext } from "./relational-strategic-observatory-corridor-context.service";
import { RelationalStrategicObservatoryBalanceService } from "./relational-strategic-observatory-balance.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";
import { RelationalStrategicObservatoryPriorityService } from "./relational-strategic-observatory-priority.service";
import { RelationalStrategicObservatoryRiskService } from "./relational-strategic-observatory-risk.service";

export type ComputedStrategicObservatoryState = {
  observatoryType: RelationalStrategicObservatoryType;
  observatoryPriority: RelationalStrategicObservatoryPriority;
  observatoryStatus: RelationalStrategicObservatoryStatus;
  severity: RelationalStrategicObservatorySeverity;
  observatoryScore: number;
  executiveExposure: number;
  systemicPressure: number;
  resilienceStrength: number;
  strategicCoordinationPressure: number;
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
  executiveInstabilityDetected: boolean;
  systemicConcentrationDetected: boolean;
  globalCoordinationStressDetected: boolean;
  observatoryPriorityDetected: boolean;
  resilienceDetected: boolean;
  strategicCollapseRiskDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalStrategicObservatoryEngineService {
  constructor(
    private readonly policy: RelationalStrategicObservatoryPolicyService,
    private readonly prioritySvc: RelationalStrategicObservatoryPriorityService,
    private readonly riskSvc: RelationalStrategicObservatoryRiskService,
    private readonly balanceSvc: RelationalStrategicObservatoryBalanceService,
  ) {}

  computeStrategicObservatoryState(ctx: StrategicObservatoryCorridorContext): ComputedStrategicObservatoryState {
    const executiveExposure = this.riskSvc.computeExecutiveExposure(ctx);
    const systemicPressure = this.riskSvc.computeSystemicPressure(ctx);
    const resilienceStrength = this.computeResilienceStrength(ctx);
    const strategicAlignmentScore = this.computeStrategicAlignment(ctx);
    const strategicCoordinationPressure = this.computeStrategicCoordinationPressure(ctx);
    const observatoryScore = this.computeObservatoryScore(ctx, resilienceStrength, executiveExposure);
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);

    const executiveInstabilityDetected = this.detectExecutiveInstability(ctx, executiveExposure);
    const systemicConcentrationDetected = this.detectSystemicConcentration(ctx, systemicPressure);
    const globalCoordinationStressDetected = this.detectGlobalCoordinationStress(ctx, strategicCoordinationPressure);
    const observatoryPriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = resilienceStrength >= 60;
    const strategicCollapseRiskDetected = this.detectStrategicCollapseRisk(ctx, observatoryScore, executiveExposure);

    return {
      observatoryType: this.balanceSvc.resolveObservatoryType(ctx, executiveExposure, systemicPressure),
      observatoryPriority: this.prioritySvc.toPriority(executiveUrgency),
      observatoryStatus: RelationalStrategicObservatoryStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      observatoryScore,
      executiveExposure,
      systemicPressure,
      resilienceStrength,
      strategicCoordinationPressure,
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
        ctx.topGlobalExecutiveSupervisionScore * 0.5 + ctx.topGlobalExecutiveSupervisionExecutivePressure * 0.5,
      ),
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      executiveInstabilityDetected,
      systemicConcentrationDetected,
      globalCoordinationStressDetected,
      observatoryPriorityDetected,
      resilienceDetected,
      strategicCollapseRiskDetected,
      diagnostics: {
        topGlobalExecutiveSupervisionScore: ctx.topGlobalExecutiveSupervisionScore,
        priorStrategicObservatoryNodeCount: ctx.priorStrategicObservatoryNodeCount,
      },
    };
  }

  computeObservatoryScore(ctx: StrategicObservatoryCorridorContext, resilience: number, exposure: number): number {
    return this.policy.clampInt(
      resilience * 0.26 +
        (100 - exposure) * 0.26 +
        ctx.topGlobalExecutiveSupervisionScore * 0.24 +
        ctx.topStrategicSynthesisScore * 0.24,
    );
  }

  computeResilienceStrength(ctx: StrategicObservatoryCorridorContext): number {
    return this.policy.clampInt(
      ctx.topGlobalExecutiveSupervisionScore * 0.35 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.3,
    );
  }

  computeStrategicAlignment(ctx: StrategicObservatoryCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  computeStrategicCoordinationPressure(ctx: StrategicObservatoryCorridorContext): number {
    return this.policy.clampInt(
      ctx.topGlobalExecutiveSupervisionExecutivePressure * 0.4 +
        ctx.topGlobalExecutiveSupervisionSystemicExposure * 0.35 +
        ctx.topExecutiveCoordinationPressure * 0.25,
    );
  }

  detectExecutiveInstability(ctx: StrategicObservatoryCorridorContext, exposure: number): boolean {
    return exposure >= 72 && ctx.peerRelationshipCount >= 3;
  }

  detectSystemicConcentration(ctx: StrategicObservatoryCorridorContext, pressure: number): boolean {
    return pressure >= 68 || ctx.topGlobalExecutiveSupervisionSystemicExposure >= 72;
  }

  detectGlobalCoordinationStress(ctx: StrategicObservatoryCorridorContext, coordination: number): boolean {
    return coordination >= 65 && ctx.priorStrategicObservatoryNodeCount >= 1;
  }

  detectStrategicCollapseRisk(
    ctx: StrategicObservatoryCorridorContext,
    observatoryScore: number,
    exposure: number,
  ): boolean {
    return observatoryScore < 35 && exposure >= 75;
  }
}
