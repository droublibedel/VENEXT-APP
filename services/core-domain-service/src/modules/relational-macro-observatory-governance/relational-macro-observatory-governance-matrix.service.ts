import { Injectable } from "@nestjs/common";
import {
  RelationalMacroObservatoryGovernanceMatrixType,
  RelationalMacroObservatoryGovernancePriority,
  RelationalMacroObservatoryGovernanceSeverity,
} from "@prisma/client";

import type { MacroObservatoryGovernanceCorridorContext } from "./relational-macro-observatory-governance-corridor-context.service";
import type { ComputedMacroObservatoryGovernanceState } from "./relational-macro-observatory-governance-engine.service";
import { RelationalMacroObservatoryGovernancePolicyService } from "./relational-macro-observatory-governance-policy.service";
import { RelationalMacroObservatoryGovernancePriorityService } from "./relational-macro-observatory-governance-priority.service";

export type MacroObservatoryGovernanceMatrixDraft = {
  matrixCode: string;
  matrixType: RelationalMacroObservatoryGovernanceMatrixType;
  severity: RelationalMacroObservatoryGovernanceSeverity;
  priority: RelationalMacroObservatoryGovernancePriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  executiveCoordinationPressure: number;
};

@Injectable()
export class RelationalMacroObservatoryGovernanceMatrixService {
  constructor(
    private readonly policy: RelationalMacroObservatoryGovernancePolicyService,
    private readonly prioritySvc: RelationalMacroObservatoryGovernancePriorityService,
  ) {}

  generateMacroObservatoryGovernanceMatrices(
    ctx: MacroObservatoryGovernanceCorridorContext,
    state: ComputedMacroObservatoryGovernanceState,
  ): MacroObservatoryGovernanceMatrixDraft[] {
    const types: RelationalMacroObservatoryGovernanceMatrixType[] = [
      RelationalMacroObservatoryGovernanceMatrixType.MACRO_OBSERVATORY_GOVERNANCE_MATRIX,
      RelationalMacroObservatoryGovernanceMatrixType.EXECUTIVE_COORDINATION_MATRIX,
      RelationalMacroObservatoryGovernanceMatrixType.SYSTEMIC_GOVERNANCE_MATRIX,
      RelationalMacroObservatoryGovernanceMatrixType.TERRITORIAL_BALANCE_MATRIX,
      RelationalMacroObservatoryGovernanceMatrixType.SECTOR_BALANCE_MATRIX,
      RelationalMacroObservatoryGovernanceMatrixType.RESILIENCE_GOVERNANCE_MATRIX,
      RelationalMacroObservatoryGovernanceMatrixType.NETWORK_ALIGNMENT_MATRIX,
    ];
    return types.map((matrixType) => this.buildMatrix(ctx, state, matrixType));
  }

  private buildMatrix(
    ctx: MacroObservatoryGovernanceCorridorContext,
    state: ComputedMacroObservatoryGovernanceState,
    matrixType: RelationalMacroObservatoryGovernanceMatrixType,
  ): MacroObservatoryGovernanceMatrixDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.3 + state.systemicConcentration * 0.35 + state.operationsPressure * 0.35,
    );
    const { title, summary } = this.templateForType(matrixType, ctx, state);
    return {
      matrixCode: `MACRO_OBS_GOV_MATRIX:${matrixType}:${ctx.relationshipId}`,
      matrixType,
      severity,
      priority,
      title,
      summary,
      institutionalPressure,
      executiveCoordinationPressure: state.executiveCoordinationPressure,
    };
  }

  private templateForType(
    matrixType: RelationalMacroObservatoryGovernanceMatrixType,
    ctx: MacroObservatoryGovernanceCorridorContext,
    state: ComputedMacroObservatoryGovernanceState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (matrixType) {
      case RelationalMacroObservatoryGovernanceMatrixType.MACRO_OBSERVATORY_GOVERNANCE_MATRIX:
        return {
          title: `Macro observatory governance matrix — ${territory}`,
          summary: `Governance score ${state.macroGovernanceScore}/100; executive coordination ${state.executiveCoordinationPressure}; network alignment ${state.networkAlignmentPressure}.`,
        };
      case RelationalMacroObservatoryGovernanceMatrixType.EXECUTIVE_COORDINATION_MATRIX:
        return {
          title: `Executive coordination matrix — ${territory}`,
          summary: `Coordination pressure ${state.executiveCoordinationPressure}/100; urgency ${state.executiveUrgency}; strategic observatory ${ctx.topStrategicObservatoryScore}.`,
        };
      case RelationalMacroObservatoryGovernanceMatrixType.SYSTEMIC_GOVERNANCE_MATRIX:
        return {
          title: `Systemic governance matrix — ${state.systemicConcentration}`,
          summary: `Systemic concentration ${state.systemicConcentration}/100; peer corridors ${ctx.peerRelationshipCount}. Breakdown: ${state.executiveAlignmentBreakdownDetected ? "yes" : "no"}.`,
        };
      case RelationalMacroObservatoryGovernanceMatrixType.TERRITORIAL_BALANCE_MATRIX:
        return {
          title: `Territorial balance matrix — ${territory}`,
          summary: `Territory ${territory}: coordination ${state.executiveCoordinationPressure}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalMacroObservatoryGovernanceMatrixType.SECTOR_BALANCE_MATRIX:
        return {
          title: `Sector balance matrix — ${sector}`,
          summary: `Sector ${sector} corridor ${ctx.relationshipId}: governance score ${state.macroGovernanceScore}; macro fragility ${ctx.macroStructuralFragility}.`,
        };
      case RelationalMacroObservatoryGovernanceMatrixType.RESILIENCE_GOVERNANCE_MATRIX:
        return {
          title: `Resilience governance matrix — strength ${state.resilienceStrength}`,
          summary: `Resilience ${state.resilienceStrength}/100; continuity ${ctx.continuityScore}; stabilization ${state.stabilizationPressure}.`,
        };
      case RelationalMacroObservatoryGovernanceMatrixType.NETWORK_ALIGNMENT_MATRIX:
        return {
          title: `Network alignment matrix`,
          summary: `Network alignment ${state.networkAlignmentPressure}; governance pressure ${state.governancePressure}; active governance ${ctx.activeGovernanceScore}.`,
        };
      default:
        return {
          title: `Macro governance matrix`,
          summary: `Score ${state.macroGovernanceScore}; coordination ${state.executiveCoordinationPressure}.`,
        };
    }
  }
}
