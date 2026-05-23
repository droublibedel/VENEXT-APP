import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveStrategicSynthesisPriority,
  RelationalExecutiveStrategicSynthesisSeverity,
  RelationalExecutiveStrategicSynthesisStatus,
  RelationalExecutiveStrategicSynthesisType,
} from "@prisma/client";

import type { ExecutiveStrategicSynthesisCorridorContext } from "./relational-executive-strategic-synthesis-corridor-context.service";
import { RelationalExecutiveStrategicSynthesisBalanceService } from "./relational-executive-strategic-synthesis-balance.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";
import { RelationalExecutiveStrategicSynthesisPriorityService } from "./relational-executive-strategic-synthesis-priority.service";
import { RelationalExecutiveStrategicSynthesisRiskService } from "./relational-executive-strategic-synthesis-risk.service";

export type ComputedExecutiveStrategicSynthesisState = {
  synthesisType: RelationalExecutiveStrategicSynthesisType;
  synthesisPriority: RelationalExecutiveStrategicSynthesisPriority;
  synthesisStatus: RelationalExecutiveStrategicSynthesisStatus;
  severity: RelationalExecutiveStrategicSynthesisSeverity;
  synthesisScore: number;
  executiveExposure: number;
  systemicPressure: number;
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
  recoveryPressure: number;
  sovereigntyPressure: number;
  executiveUrgency: number;
  executiveInstabilityDetected: boolean;
  systemicEscalationDetected: boolean;
  strategicPriorityDetected: boolean;
  resilienceDetected: boolean;
  strategicCollapseRiskDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalExecutiveStrategicSynthesisEngineService {
  constructor(
    private readonly policy: RelationalExecutiveStrategicSynthesisPolicyService,
    private readonly prioritySvc: RelationalExecutiveStrategicSynthesisPriorityService,
    private readonly riskSvc: RelationalExecutiveStrategicSynthesisRiskService,
    private readonly balanceSvc: RelationalExecutiveStrategicSynthesisBalanceService,
  ) {}

  computeExecutiveStrategicSynthesisState(
    ctx: ExecutiveStrategicSynthesisCorridorContext,
  ): ComputedExecutiveStrategicSynthesisState {
    const executiveExposure = this.riskSvc.computeExecutiveExposure(ctx);
    const systemicPressure = this.riskSvc.computeSystemicPressure(ctx);
    const resilienceStrength = this.computeResilienceStrength(ctx);
    const strategicAlignmentScore = this.computeStrategicAlignment(ctx);
    const synthesisScore = this.computeSynthesisScore(ctx, resilienceStrength, executiveExposure);
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);

    const executiveInstabilityDetected = this.detectExecutiveInstability(ctx, executiveExposure);
    const systemicEscalationDetected = this.detectSystemicEscalation(ctx, systemicPressure);
    const strategicPriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = resilienceStrength >= 60;
    const strategicCollapseRiskDetected = this.detectStrategicCollapseRisk(ctx, synthesisScore, executiveExposure);

    return {
      synthesisType: this.balanceSvc.resolveSynthesisType(ctx, executiveExposure, systemicPressure),
      synthesisPriority: this.prioritySvc.toPriority(executiveUrgency),
      synthesisStatus: RelationalExecutiveStrategicSynthesisStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      synthesisScore,
      executiveExposure,
      systemicPressure,
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
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      executiveInstabilityDetected,
      systemicEscalationDetected,
      strategicPriorityDetected,
      resilienceDetected,
      strategicCollapseRiskDetected,
      diagnostics: {
        topControlRoomScore: ctx.topControlRoomScore,
        priorExecutiveStrategicSynthesisNodeCount: ctx.priorExecutiveStrategicSynthesisNodeCount,
      },
    };
  }

  computeSynthesisScore(ctx: ExecutiveStrategicSynthesisCorridorContext, resilience: number, exposure: number): number {
    return this.policy.clampInt(
      resilience * 0.26 +
        (100 - exposure) * 0.26 +
        ctx.topControlRoomScore * 0.24 +
        ctx.topOperationsScore * 0.24,
    );
  }

  computeResilienceStrength(ctx: ExecutiveStrategicSynthesisCorridorContext): number {
    return this.policy.clampInt(
      ctx.topControlRoomScore * 0.35 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.3,
    );
  }

  computeStrategicAlignment(ctx: ExecutiveStrategicSynthesisCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  detectExecutiveInstability(ctx: ExecutiveStrategicSynthesisCorridorContext, exposure: number): boolean {
    return exposure >= 72 && ctx.peerRelationshipCount >= 3;
  }

  detectSystemicEscalation(ctx: ExecutiveStrategicSynthesisCorridorContext, pressure: number): boolean {
    return pressure >= 68 || ctx.topControlRoomExecutivePressure >= 72;
  }

  detectStrategicCollapseRisk(
    ctx: ExecutiveStrategicSynthesisCorridorContext,
    synthesisScore: number,
    exposure: number,
  ): boolean {
    return synthesisScore < 35 && exposure >= 75;
  }
}
