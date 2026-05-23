import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicMonitoringPriority,
  RelationalEconomicMonitoringSeverity,
  RelationalEconomicMonitoringStatus,
  RelationalEconomicMonitoringType,
} from "@prisma/client";

import type { EconomicMonitoringCorridorContext } from "./relational-economic-monitoring-corridor-context.service";
import { RelationalEconomicMonitoringBalanceService } from "./relational-economic-monitoring-balance.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";
import { RelationalEconomicMonitoringPriorityService } from "./relational-economic-monitoring-priority.service";
import { RelationalEconomicMonitoringRiskService } from "./relational-economic-monitoring-risk.service";

export type ComputedMonitoringState = {
  monitoringType: RelationalEconomicMonitoringType;
  monitoringPriority: RelationalEconomicMonitoringPriority;
  monitoringStatus: RelationalEconomicMonitoringStatus;
  severity: RelationalEconomicMonitoringSeverity;
  monitoringScore: number;
  executivePressure: number;
  systemicRisk: number;
  resilienceLevel: number;
  governancePressure: number;
  arbitrationPressure: number;
  stabilizationPressure: number;
  sovereigntyPressure: number;
  recoveryPressure: number;
  coordinationPressure: number;
  dependencyPressure: number;
  executiveUrgency: number;
  strategicImbalanceDetected: boolean;
  systemicEscalationDetected: boolean;
  criticalExecutiveSignals: string[];
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalEconomicMonitoringEngineService {
  constructor(
    private readonly policy: RelationalEconomicMonitoringPolicyService,
    private readonly prioritySvc: RelationalEconomicMonitoringPriorityService,
    private readonly riskSvc: RelationalEconomicMonitoringRiskService,
    private readonly balanceSvc: RelationalEconomicMonitoringBalanceService,
  ) {}

  computeMonitoringState(ctx: EconomicMonitoringCorridorContext): ComputedMonitoringState {
    const executivePressure = this.computeExecutivePressure(ctx);
    const systemicRisk = this.computeSystemicRisk(ctx);
    const resilienceLevel = this.computeStrategicResilience(ctx);
    const monitoringScore = this.computeMonitoringScore(ctx, resilienceLevel, systemicRisk);
    const executiveUrgency = this.computeExecutivePriority(ctx);

    const strategicImbalanceDetected = this.detectStrategicImbalance(ctx);
    const systemicEscalationDetected = this.detectSystemicEscalation(ctx, systemicRisk);
    const criticalExecutiveSignals = this.detectCriticalExecutiveSignals(ctx, executivePressure, systemicRisk);

    return {
      monitoringType: this.balanceSvc.resolveMonitoringType(ctx, systemicRisk, executivePressure),
      monitoringPriority: this.prioritySvc.toPriority(executiveUrgency),
      monitoringStatus: RelationalEconomicMonitoringStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      monitoringScore,
      executivePressure,
      systemicRisk,
      resilienceLevel,
      governancePressure: this.policy.clampInt(100 - ctx.activeGovernanceStability + ctx.topConflictPressure * 0.3),
      arbitrationPressure: this.policy.clampInt(ctx.topArbitrationScore),
      stabilizationPressure: this.policy.clampInt(ctx.topInstabilityPressure),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      coordinationPressure: this.policy.clampInt(
        ctx.orchestrationOpenCount * 10 + ctx.peerRelationshipCount * 5 + ctx.governanceConflictCount * 6,
      ),
      dependencyPressure: this.policy.clampInt(ctx.dependencyExposureScore),
      executiveUrgency,
      strategicImbalanceDetected,
      systemicEscalationDetected,
      criticalExecutiveSignals,
      diagnostics: {
        topStabilizationScore: ctx.topStabilizationScore,
        activeGovernanceScore: ctx.activeGovernanceScore,
        peerRelationshipCount: ctx.peerRelationshipCount,
      },
    };
  }

  computeMonitoringScore(ctx: EconomicMonitoringCorridorContext, resilience: number, systemicRisk: number): number {
    return this.policy.clampInt(
      resilience * 0.35 + (100 - systemicRisk) * 0.3 + ctx.topStabilizationScore * 0.2 + ctx.activeGovernanceScore * 0.15,
    );
  }

  computeExecutivePressure(ctx: EconomicMonitoringCorridorContext): number {
    return this.policy.clampInt(
      ctx.topInstabilityPressure * 0.35 +
        ctx.topArbitrationUrgency * 0.25 +
        ctx.activeRecoveryInterventionPriority * 0.2 +
        ctx.pressureScore * 0.2,
    );
  }

  computeSystemicRisk(ctx: EconomicMonitoringCorridorContext): number {
    return this.riskSvc.computeSystemicRisk(ctx);
  }

  computeCoordinationPressure(ctx: EconomicMonitoringCorridorContext): number {
    return this.policy.clampInt(
      ctx.orchestrationOpenCount * 10 + ctx.peerRelationshipCount * 5 + ctx.governanceConflictCount * 6,
    );
  }

  computeStrategicResilience(ctx: EconomicMonitoringCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStabilizationScore * 0.4 + ctx.continuityScore * 0.3 + ctx.autonomyScore * 0.3,
    );
  }

  computeExecutivePriority(ctx: EconomicMonitoringCorridorContext): number {
    return this.prioritySvc.computeExecutivePriority(ctx);
  }

  detectCriticalExecutiveSignals(
    ctx: EconomicMonitoringCorridorContext,
    executivePressure: number,
    systemicRisk: number,
  ): string[] {
    const signals: string[] = [];
    if (executivePressure >= 60) signals.push("EXECUTIVE_PRESSURE_ELEVATED");
    if (systemicRisk >= 65) signals.push("SYSTEMIC_RISK_ELEVATED");
    if (ctx.topInstabilityPressure >= 55) signals.push("STABILIZATION_STRESS");
    if (ctx.governanceConflictCount >= 2) signals.push("GOVERNANCE_CONFLICT_CLUSTER");
    return signals;
  }

  detectStrategicImbalance(ctx: EconomicMonitoringCorridorContext): boolean {
    return this.riskSvc.detectStrategicImbalance(ctx);
  }

  detectSystemicEscalation(ctx: EconomicMonitoringCorridorContext, systemicRisk: number): boolean {
    return this.riskSvc.detectSystemicEscalation(ctx, systemicRisk);
  }
}
