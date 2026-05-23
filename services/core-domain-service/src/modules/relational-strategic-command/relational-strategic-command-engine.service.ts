import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicCommandPriority,
  RelationalStrategicCommandSeverity,
  RelationalStrategicCommandStatus,
  RelationalStrategicCommandType,
} from "@prisma/client";

import type { StrategicCommandCorridorContext } from "./relational-strategic-command-corridor-context.service";
import { RelationalStrategicCommandBalanceService } from "./relational-strategic-command-balance.service";
import { RelationalStrategicCommandPolicyService } from "./relational-strategic-command-policy.service";
import { RelationalStrategicCommandPriorityService } from "./relational-strategic-command-priority.service";
import { RelationalStrategicCommandRiskService } from "./relational-strategic-command-risk.service";

export type ComputedStrategicCommandState = {
  commandType: RelationalStrategicCommandType;
  commandPriority: RelationalStrategicCommandPriority;
  commandStatus: RelationalStrategicCommandStatus;
  severity: RelationalStrategicCommandSeverity;
  commandScore: number;
  systemicPressure: number;
  executiveConcentration: number;
  resilienceStrength: number;
  strategicBalanceScore: number;
  governancePressure: number;
  arbitrationPressure: number;
  stabilizationPressure: number;
  monitoringPressure: number;
  orchestrationPressure: number;
  institutionalPressure: number;
  intelligencePressure: number;
  recoveryPressure: number;
  sovereigntyPressure: number;
  executiveUrgency: number;
  systemicEscalationDetected: boolean;
  executiveOverloadDetected: boolean;
  strategicPriorityDetected: boolean;
  resilienceDetected: boolean;
  strategicCollapseRiskDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalStrategicCommandEngineService {
  constructor(
    private readonly policy: RelationalStrategicCommandPolicyService,
    private readonly prioritySvc: RelationalStrategicCommandPriorityService,
    private readonly riskSvc: RelationalStrategicCommandRiskService,
    private readonly balanceSvc: RelationalStrategicCommandBalanceService,
  ) {}

  computeStrategicCommandState(ctx: StrategicCommandCorridorContext): ComputedStrategicCommandState {
    const executiveConcentration = this.riskSvc.computeExecutiveConcentration(ctx);
    const systemicPressure = this.riskSvc.computeSystemicPressure(ctx);
    const resilienceStrength = this.computeResilienceStrength(ctx);
    const strategicBalanceScore = this.computeStrategicBalance(ctx);
    const commandScore = this.computeCommandScore(ctx, resilienceStrength, systemicPressure);
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);

    const systemicEscalationDetected = this.detectSystemicEscalation(ctx, systemicPressure);
    const executiveOverloadDetected = this.detectExecutiveOverload(ctx, executiveConcentration);
    const strategicPriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = resilienceStrength >= 60;
    const strategicCollapseRiskDetected = commandScore < 35 && systemicPressure >= 75;

    return {
      commandType: this.balanceSvc.resolveCommandType(ctx, systemicPressure, executiveConcentration),
      commandPriority: this.prioritySvc.toPriority(executiveUrgency),
      commandStatus: RelationalStrategicCommandStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      commandScore,
      executiveConcentration,
      resilienceStrength,
      systemicPressure,
      strategicBalanceScore,
      governancePressure: this.policy.clampInt(100 - ctx.activeGovernanceStability + ctx.topConflictPressure * 0.3),
      arbitrationPressure: this.policy.clampInt(ctx.topArbitrationScore),
      stabilizationPressure: this.policy.clampInt(ctx.topInstabilityPressure),
      monitoringPressure: this.policy.clampInt(ctx.topExecutivePressure),
      orchestrationPressure: this.policy.clampInt(ctx.topExecutiveCoordinationPressure),
      institutionalPressure: this.policy.clampInt(ctx.topInstitutionalScore * 0.5 + ctx.topInstitutionalExecutiveRisk * 0.5),
      intelligencePressure: this.policy.clampInt(
        ctx.topStrategicIntelligenceScore * 0.5 + ctx.topStrategicExecutiveConcentration * 0.5,
      ),
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      systemicEscalationDetected,
      executiveOverloadDetected,
      strategicPriorityDetected,
      resilienceDetected,
      strategicCollapseRiskDetected,
      diagnostics: {
        topStrategicIntelligenceScore: ctx.topStrategicIntelligenceScore,
        priorStrategicCommandNodeCount: ctx.priorStrategicCommandNodeCount,
      },
    };
  }

  computeCommandScore(ctx: StrategicCommandCorridorContext, resilience: number, pressure: number): number {
    return this.policy.clampInt(
      resilience * 0.28 +
        (100 - pressure) * 0.27 +
        ctx.topStrategicIntelligenceScore * 0.25 +
        ctx.topOrchestrationScore * 0.2,
    );
  }

  computeResilienceStrength(ctx: StrategicCommandCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicIntelligenceScore * 0.35 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.3,
    );
  }

  computeStrategicBalance(ctx: StrategicCommandCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  detectSystemicEscalation(ctx: StrategicCommandCorridorContext, pressure: number): boolean {
    return pressure >= 72 && ctx.peerRelationshipCount >= 3;
  }

  detectExecutiveOverload(ctx: StrategicCommandCorridorContext, concentration: number): boolean {
    return concentration >= 68 || ctx.topStrategicExecutiveConcentration >= 72;
  }

  detectStrategicCollapseRisk(ctx: StrategicCommandCorridorContext, commandScore: number, pressure: number): boolean {
    return commandScore < 35 && pressure >= 75;
  }
}
