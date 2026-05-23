import { Injectable } from "@nestjs/common";
import {
  RelationalMacroObservatoryGovernancePriority,
  RelationalMacroObservatoryGovernanceSeverity,
  RelationalMacroObservatoryGovernanceStatus,
  RelationalMacroObservatoryGovernanceType,
} from "@prisma/client";

import type { MacroObservatoryGovernanceCorridorContext } from "./relational-macro-observatory-governance-corridor-context.service";
import { RelationalMacroObservatoryGovernanceBalanceService } from "./relational-macro-observatory-governance-balance.service";
import { RelationalMacroObservatoryGovernancePolicyService } from "./relational-macro-observatory-governance-policy.service";
import { RelationalMacroObservatoryGovernancePriorityService } from "./relational-macro-observatory-governance-priority.service";
import { RelationalMacroObservatoryGovernanceRiskService } from "./relational-macro-observatory-governance-risk.service";

export type ComputedMacroObservatoryGovernanceState = {
  macroGovernanceType: RelationalMacroObservatoryGovernanceType;
  macroGovernancePriority: RelationalMacroObservatoryGovernancePriority;
  macroGovernanceStatus: RelationalMacroObservatoryGovernanceStatus;
  severity: RelationalMacroObservatoryGovernanceSeverity;
  macroGovernanceScore: number;
  executiveCoordinationPressure: number;
  systemicConcentration: number;
  resilienceStrength: number;
  networkAlignmentPressure: number;
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
  networkCoordinationStressDetected: boolean;
  executiveAlignmentBreakdownDetected: boolean;
  systemicGovernanceConcentrationDetected: boolean;
  macroGovernancePriorityDetected: boolean;
  resilienceDetected: boolean;
  strategicCollapseRiskDetected: boolean;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalMacroObservatoryGovernanceEngineService {
  constructor(
    private readonly policy: RelationalMacroObservatoryGovernancePolicyService,
    private readonly prioritySvc: RelationalMacroObservatoryGovernancePriorityService,
    private readonly riskSvc: RelationalMacroObservatoryGovernanceRiskService,
    private readonly balanceSvc: RelationalMacroObservatoryGovernanceBalanceService,
  ) {}

  computeMacroObservatoryGovernanceState(
    ctx: MacroObservatoryGovernanceCorridorContext,
  ): ComputedMacroObservatoryGovernanceState {
    const executiveCoordinationPressure = this.computeExecutiveCoordinationPressure(ctx);
    const systemicConcentration = this.computeSystemicConcentration(ctx);
    const resilienceStrength = this.computeResilienceStrength(ctx);
    const strategicAlignmentScore = this.computeStrategicAlignment(ctx);
    const networkAlignmentPressure = this.computeNetworkAlignmentPressure(ctx);
    const macroGovernanceScore = this.computeMacroGovernanceScore(
      ctx,
      resilienceStrength,
      executiveCoordinationPressure,
    );
    const executiveUrgency = this.prioritySvc.computeExecutiveUrgency(ctx);
    const macroGovernancePriority = this.computeMacroGovernancePriority(executiveUrgency);

    const networkCoordinationStressDetected = this.detectNetworkCoordinationStress(
      ctx,
      networkAlignmentPressure,
    );
    const executiveAlignmentBreakdownDetected = this.detectExecutiveAlignmentBreakdown(
      ctx,
      executiveCoordinationPressure,
    );
    const systemicGovernanceConcentrationDetected = this.detectSystemicGovernanceConcentration(
      ctx,
      systemicConcentration,
    );
    const macroGovernancePriorityDetected = executiveUrgency >= 55;
    const resilienceDetected = resilienceStrength >= 60;
    const strategicCollapseRiskDetected = this.detectStrategicCollapseRisk(
      ctx,
      macroGovernanceScore,
      executiveCoordinationPressure,
    );

    return {
      macroGovernanceType: this.balanceSvc.resolveMacroGovernanceType(
        ctx,
        executiveCoordinationPressure,
        systemicConcentration,
      ),
      macroGovernancePriority,
      macroGovernanceStatus: RelationalMacroObservatoryGovernanceStatus.ACTIVE,
      severity: this.prioritySvc.toSeverity(executiveUrgency),
      macroGovernanceScore,
      executiveCoordinationPressure,
      systemicConcentration,
      resilienceStrength,
      networkAlignmentPressure,
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
        ctx.topStrategicObservatoryScore * 0.5 + ctx.topStrategicObservatoryExecutiveExposure * 0.5,
      ),
      recoveryPressure: this.policy.clampInt(
        ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
      ),
      sovereigntyPressure: this.policy.clampInt((100 - ctx.autonomyScore) * 0.5 + ctx.strategicCaptivityRisk * 0.5),
      executiveUrgency,
      networkCoordinationStressDetected,
      executiveAlignmentBreakdownDetected,
      systemicGovernanceConcentrationDetected,
      macroGovernancePriorityDetected,
      resilienceDetected,
      strategicCollapseRiskDetected,
      diagnostics: {
        topStrategicObservatoryScore: ctx.topStrategicObservatoryScore,
        priorMacroObservatoryGovernanceNodeCount: ctx.priorMacroObservatoryGovernanceNodeCount,
        networkCoordinationStressDetected,
        executiveAlignmentBreakdownDetected,
        systemicGovernanceConcentrationDetected,
      },
    };
  }

  computeMacroGovernanceScore(
    ctx: MacroObservatoryGovernanceCorridorContext,
    resilience: number,
    coordination: number,
  ): number {
    return this.policy.clampInt(
      resilience * 0.26 +
        (100 - coordination) * 0.26 +
        ctx.topStrategicObservatoryScore * 0.24 +
        ctx.topGlobalExecutiveSupervisionScore * 0.24,
    );
  }

  computeExecutiveCoordinationPressure(ctx: MacroObservatoryGovernanceCorridorContext): number {
    return this.riskSvc.computeExecutiveCoordinationPressure(ctx);
  }

  computeSystemicConcentration(ctx: MacroObservatoryGovernanceCorridorContext): number {
    return this.riskSvc.computeSystemicConcentration(ctx);
  }

  computeResilienceStrength(ctx: MacroObservatoryGovernanceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicObservatoryScore * 0.35 + ctx.topStabilizationScore * 0.35 + ctx.continuityScore * 0.3,
    );
  }

  computeStrategicAlignment(ctx: MacroObservatoryGovernanceCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeGovernanceScore * 0.35 + ctx.topMonitoringScore * 0.35 + (100 - ctx.topSystemicRisk) * 0.3,
    );
  }

  computeNetworkAlignmentPressure(ctx: MacroObservatoryGovernanceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicObservatoryExecutiveExposure * 0.4 +
        ctx.topStrategicObservatorySystemicPressure * 0.35 +
        ctx.topExecutiveCoordinationPressure * 0.25,
    );
  }

  computeMacroGovernancePriority(
    urgency: number,
  ): RelationalMacroObservatoryGovernancePriority {
    return this.prioritySvc.toPriority(urgency);
  }

  detectNetworkCoordinationStress(
    ctx: MacroObservatoryGovernanceCorridorContext,
    alignment: number,
  ): boolean {
    return alignment >= 65 && ctx.priorMacroObservatoryGovernanceNodeCount >= 1;
  }

  detectExecutiveAlignmentBreakdown(
    ctx: MacroObservatoryGovernanceCorridorContext,
    coordination: number,
  ): boolean {
    return coordination >= 72 && ctx.peerRelationshipCount >= 3;
  }

  detectSystemicGovernanceConcentration(
    ctx: MacroObservatoryGovernanceCorridorContext,
    concentration: number,
  ): boolean {
    return concentration >= 68 || ctx.topStrategicObservatorySystemicPressure >= 72;
  }

  detectStrategicCollapseRisk(
    ctx: MacroObservatoryGovernanceCorridorContext,
    score: number,
    coordination: number,
  ): boolean {
    return score < 35 && coordination >= 75;
  }
}
