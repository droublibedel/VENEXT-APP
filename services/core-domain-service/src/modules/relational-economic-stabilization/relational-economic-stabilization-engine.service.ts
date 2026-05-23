import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicStabilizationPriority,
  RelationalEconomicStabilizationSeverity,
  RelationalEconomicStabilizationStatus,
  RelationalEconomicStabilizationType,
} from "@prisma/client";

import type { EconomicStabilizationCorridorContext } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationBalanceService } from "./relational-economic-stabilization-balance.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";
import { RelationalEconomicStabilizationPressureService } from "./relational-economic-stabilization-pressure.service";
import { RelationalEconomicStabilizationRiskService } from "./relational-economic-stabilization-risk.service";

export type ComputedStabilizationState = {
  stabilizationType: RelationalEconomicStabilizationType;
  stabilizationPriority: RelationalEconomicStabilizationPriority;
  stabilizationStatus: RelationalEconomicStabilizationStatus;
  severity: RelationalEconomicStabilizationSeverity;
  stabilizationScore: number;
  instabilityPressure: number;
  resilienceLevel: number;
  systemicExposure: number;
  dependencyPressure: number;
  continuityPressure: number;
  sovereigntyPressure: number;
  arbitrationPressure: number;
  governancePressure: number;
  recoveryPressure: number;
  coordinationStress: number;
  stabilizationUrgency: number;
  recoveryPotential: number;
  corridorResilience: number;
  strategicInstabilityDetected: boolean;
  systemicCollapseRiskDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalEconomicStabilizationEngineService {
  constructor(
    private readonly policy: RelationalEconomicStabilizationPolicyService,
    private readonly pressureSvc: RelationalEconomicStabilizationPressureService,
    private readonly riskSvc: RelationalEconomicStabilizationRiskService,
    private readonly balanceSvc: RelationalEconomicStabilizationBalanceService,
  ) {}

  computeStabilizationState(ctx: EconomicStabilizationCorridorContext): ComputedStabilizationState {
    const instabilityPressure = this.computeInstabilityPressure(ctx);
    const systemicExposure = this.computeSystemicExposure(ctx);
    const recoveryPotential = this.computeRecoveryPotential(ctx);
    const corridorResilience = this.computeCorridorResilience(ctx, recoveryPotential);
    const stabilizationScore = this.computeStabilizationScore(ctx, corridorResilience, systemicExposure);
    const stabilizationUrgency = this.policy.clampInt(
      instabilityPressure * 0.45 + systemicExposure * 0.35 + (100 - corridorResilience) * 0.2,
    );

    return {
      stabilizationType: this.balanceSvc.resolveStabilizationType(ctx, systemicExposure, instabilityPressure),
      stabilizationPriority: this.balanceSvc.toPriority(stabilizationUrgency),
      stabilizationStatus: RelationalEconomicStabilizationStatus.ACTIVE,
      severity: this.balanceSvc.toSeverity(stabilizationUrgency),
      stabilizationScore,
      instabilityPressure,
      resilienceLevel: corridorResilience,
      systemicExposure,
      dependencyPressure: this.policy.clampInt(ctx.dependencyExposureScore),
      continuityPressure: this.policy.clampInt((100 - ctx.continuityScore) * 0.6 + ctx.continuityInstability * 0.4),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      arbitrationPressure: this.pressureSvc.computeArbitrationPressure(ctx),
      governancePressure: this.pressureSvc.computeGovernancePressure(ctx),
      recoveryPressure: this.pressureSvc.computeRecoveryPressure(ctx),
      coordinationStress: this.pressureSvc.computeCoordinationStress(ctx),
      stabilizationUrgency,
      recoveryPotential,
      corridorResilience,
      strategicInstabilityDetected: this.detectStrategicInstability(ctx, instabilityPressure),
      systemicCollapseRiskDetected: this.detectSystemicCollapseRisk(ctx, systemicExposure),
      diagnostics: {
        topArbitrationScore: ctx.topArbitrationScore,
        activeGovernanceScore: ctx.activeGovernanceScore,
        peerRelationshipCount: ctx.peerRelationshipCount,
      },
    };
  }

  computeStabilizationScore(
    ctx: EconomicStabilizationCorridorContext,
    resilience: number,
    systemicExposure: number,
  ): number {
    return this.policy.clampInt(
      resilience * 0.4 + ctx.activeGovernanceScore * 0.25 + (100 - systemicExposure) * 0.2 + ctx.continuityScore * 0.15,
    );
  }

  computeInstabilityPressure(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeRecoveryInstability * 0.3 +
        ctx.topConflictPressure * 0.25 +
        ctx.topArbitrationUrgency * 0.2 +
        ctx.supplyFlowDisruptionAvg * 0.15 +
        ctx.pressureScore * 0.1,
    );
  }

  computeRecoveryPotential(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeRecoveryScore * 0.5 + ctx.corridorSelfRecoveryProbability * 100 * 0.3 + (100 - ctx.activeRecoveryInstability) * 0.2,
    );
  }

  computeSystemicExposure(ctx: EconomicStabilizationCorridorContext): number {
    return this.riskSvc.computeSystemicExposure(ctx);
  }

  computeCoordinationStress(ctx: EconomicStabilizationCorridorContext): number {
    return this.pressureSvc.computeCoordinationStress(ctx);
  }

  computeCorridorResilience(ctx: EconomicStabilizationCorridorContext, recoveryPotential: number): number {
    return this.policy.clampInt(
      recoveryPotential * 0.35 +
        ctx.continuityScore * 0.25 +
        ctx.autonomyScore * 0.2 +
        ctx.activeGovernanceStability * 0.2,
    );
  }

  detectStrategicInstability(ctx: EconomicStabilizationCorridorContext, instabilityPressure: number): boolean {
    return this.riskSvc.detectStrategicInstability(ctx, instabilityPressure);
  }

  detectSystemicCollapseRisk(ctx: EconomicStabilizationCorridorContext, systemicExposure: number): boolean {
    return this.riskSvc.detectSystemicCollapseRisk(ctx, systemicExposure);
  }
}
