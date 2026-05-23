import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveOperationsPriority,
  RelationalExecutiveOperationsSeverity,
  RelationalExecutiveOperationsStatus,
  RelationalExecutiveOperationsType,
} from "@prisma/client";

import type { ExecutiveOperationsCorridorContext } from "./relational-executive-operations-corridor-context.service";
import { RelationalExecutiveOperationsBalanceService } from "./relational-executive-operations-balance.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";
import { RelationalExecutiveOperationsPriorityService } from "./relational-executive-operations-priority.service";
import { RelationalExecutiveOperationsRiskService } from "./relational-executive-operations-risk.service";

export type ComputedExecutiveOperationsState = {
  operationsType: RelationalExecutiveOperationsType;
  operationsPriority: RelationalExecutiveOperationsPriority;
  operationsStatus: RelationalExecutiveOperationsStatus;
  severity: RelationalExecutiveOperationsSeverity;
  executiveOperationsScore: number;
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
  recoveryPressure: number;
  sovereigntyPressure: number;
  executiveUrgency: number;
  executiveEscalationDetected: boolean;
  coordinationCollapseDetected: boolean;
  strategicPriorityDetected: boolean;
  resilienceDetected: boolean;
  operationalInstabilityDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalExecutiveOperationsEngineService {
  constructor(
    private readonly policy: RelationalExecutiveOperationsPolicyService,
    private readonly prioritySvc: RelationalExecutiveOperationsPriorityService,
    private readonly riskSvc: RelationalExecutiveOperationsRiskService,
    private readonly balanceSvc: RelationalExecutiveOperationsBalanceService,
  ) {}

  computeExecutiveOperationsState(ctx: ExecutiveOperationsCorridorContext): ComputedExecutiveOperationsState {
    const executivePressure = this.riskSvc.computeExecutivePressure(ctx);
    const systemicConcentration = this.riskSvc.computeSystemicConcentration(ctx);
    const resilienceStrength = this.computeResilienceStrength(ctx);
    const strategicBalanceScore = this.computeStrategicBalance(ctx);
    const executiveOperationsScore = this.computeExecutiveOperationsScore(
      ctx,
      resilienceStrength,
      executivePressure,
    );
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);

    const executiveEscalationDetected = this.detectExecutiveEscalation(ctx, executivePressure);
    const coordinationCollapseDetected = this.detectCoordinationCollapse(ctx, systemicConcentration);
    const strategicPriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = resilienceStrength >= 60;
    const operationalInstabilityDetected =
      executiveOperationsScore < 35 && executivePressure >= 75;

    return {
      operationsType: this.balanceSvc.resolveOperationsType(ctx, executivePressure, systemicConcentration),
      operationsPriority: this.prioritySvc.toPriority(executiveUrgency),
      operationsStatus: RelationalExecutiveOperationsStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      executiveOperationsScore,
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
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      executiveEscalationDetected,
      coordinationCollapseDetected,
      strategicPriorityDetected,
      resilienceDetected,
      operationalInstabilityDetected,
      diagnostics: {
        topCommandScore: ctx.topCommandScore,
        priorExecutiveOperationsNodeCount: ctx.priorExecutiveOperationsNodeCount,
      },
    };
  }

  computeExecutiveOperationsScore(
    ctx: ExecutiveOperationsCorridorContext,
    resilience: number,
    pressure: number,
  ): number {
    return this.policy.clampInt(
      resilience * 0.28 +
        (100 - pressure) * 0.27 +
        ctx.topCommandScore * 0.25 +
        ctx.topOrchestrationScore * 0.2,
    );
  }

  computeResilienceStrength(ctx: ExecutiveOperationsCorridorContext): number {
    return this.policy.clampInt(
      ctx.topCommandScore * 0.35 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.3,
    );
  }

  computeStrategicBalance(ctx: ExecutiveOperationsCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  detectExecutiveEscalation(ctx: ExecutiveOperationsCorridorContext, pressure: number): boolean {
    return pressure >= 72 && ctx.peerRelationshipCount >= 3;
  }

  detectCoordinationCollapse(ctx: ExecutiveOperationsCorridorContext, concentration: number): boolean {
    return concentration >= 68 || ctx.topCommandExecutiveConcentration >= 72;
  }

  detectOperationalInstability(
    ctx: ExecutiveOperationsCorridorContext,
    executiveOperationsScore: number,
    pressure: number,
  ): boolean {
    return executiveOperationsScore < 35 && pressure >= 75;
  }
}
