import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveControlRoomPriority,
  RelationalExecutiveControlRoomSeverity,
  RelationalExecutiveControlRoomStatus,
  RelationalExecutiveControlRoomType,
} from "@prisma/client";

import type { ExecutiveControlRoomCorridorContext } from "./relational-executive-control-room-corridor-context.service";
import { RelationalExecutiveControlRoomBalanceService } from "./relational-executive-control-room-balance.service";
import { RelationalExecutiveControlRoomPolicyService } from "./relational-executive-control-room-policy.service";
import { RelationalExecutiveControlRoomPriorityService } from "./relational-executive-control-room-priority.service";
import { RelationalExecutiveControlRoomRiskService } from "./relational-executive-control-room-risk.service";

export type ComputedExecutiveControlRoomState = {
  controlRoomType: RelationalExecutiveControlRoomType;
  boardPriority: RelationalExecutiveControlRoomPriority;
  controlRoomStatus: RelationalExecutiveControlRoomStatus;
  severity: RelationalExecutiveControlRoomSeverity;
  controlRoomScore: number;
  executivePressure: number;
  systemicConcentration: number;
  resilienceStrength: number;
  strategicBalanceScore: number;
  governancePressure: number;
  arbitrationPressure: number;
  stabilizationPressure: number;
  monitoringPressure: number;
  orchestrationPressure: number;
  institutionalPressure: number;
  intelligencePressure: number;
  commandPressure: number;
  operationsPressure: number;
  recoveryPressure: number;
  sovereigntyPressure: number;
  executiveUrgency: number;
  executiveEscalationDetected: boolean;
  strategicCoordinationFailureDetected: boolean;
  strategicPriorityDetected: boolean;
  resilienceDetected: boolean;
  systemicCollapseRiskDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalExecutiveControlRoomEngineService {
  constructor(
    private readonly policy: RelationalExecutiveControlRoomPolicyService,
    private readonly prioritySvc: RelationalExecutiveControlRoomPriorityService,
    private readonly riskSvc: RelationalExecutiveControlRoomRiskService,
    private readonly balanceSvc: RelationalExecutiveControlRoomBalanceService,
  ) {}

  computeExecutiveControlRoomState(ctx: ExecutiveControlRoomCorridorContext): ComputedExecutiveControlRoomState {
    const executivePressure = this.riskSvc.computeExecutivePressure(ctx);
    const systemicConcentration = this.riskSvc.computeSystemicConcentration(ctx);
    const resilienceStrength = this.computeResilienceStrength(ctx);
    const strategicBalanceScore = this.computeStrategicBalance(ctx);
    const controlRoomScore = this.computeControlRoomScore(ctx, resilienceStrength, executivePressure);
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);

    const executiveEscalationDetected = this.detectExecutiveEscalation(ctx, executivePressure);
    const strategicCoordinationFailureDetected = this.detectStrategicCoordinationFailure(ctx, systemicConcentration);
    const strategicPriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = resilienceStrength >= 60;
    const systemicCollapseRiskDetected = controlRoomScore < 35 && executivePressure >= 75;

    return {
      controlRoomType: this.balanceSvc.resolveControlRoomType(ctx, executivePressure, systemicConcentration),
      boardPriority: this.prioritySvc.toPriority(executiveUrgency),
      controlRoomStatus: RelationalExecutiveControlRoomStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      controlRoomScore,
      executivePressure,
      systemicConcentration,
      resilienceStrength,
      strategicBalanceScore,
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
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      executiveEscalationDetected,
      strategicCoordinationFailureDetected,
      strategicPriorityDetected,
      resilienceDetected,
      systemicCollapseRiskDetected,
      diagnostics: {
        topOperationsScore: ctx.topOperationsScore,
        priorExecutiveControlRoomNodeCount: ctx.priorExecutiveControlRoomNodeCount,
      },
    };
  }

  computeControlRoomScore(ctx: ExecutiveControlRoomCorridorContext, resilience: number, pressure: number): number {
    return this.policy.clampInt(
      resilience * 0.28 +
        (100 - pressure) * 0.27 +
        ctx.topOperationsScore * 0.25 +
        ctx.topOrchestrationScore * 0.2,
    );
  }

  computeResilienceStrength(ctx: ExecutiveControlRoomCorridorContext): number {
    return this.policy.clampInt(
      ctx.topOperationsScore * 0.35 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.3,
    );
  }

  computeStrategicBalance(ctx: ExecutiveControlRoomCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  detectExecutiveEscalation(ctx: ExecutiveControlRoomCorridorContext, pressure: number): boolean {
    return pressure >= 72 && ctx.peerRelationshipCount >= 3;
  }

  detectStrategicCoordinationFailure(ctx: ExecutiveControlRoomCorridorContext, concentration: number): boolean {
    return concentration >= 68 || ctx.topOperationsExecutivePressure >= 72;
  }

  detectSystemicCollapseRisk(
    ctx: ExecutiveControlRoomCorridorContext,
    controlRoomScore: number,
    pressure: number,
  ): boolean {
    return controlRoomScore < 35 && pressure >= 75;
  }
}
