import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveOperationsMatrixType,
  RelationalExecutiveOperationsPriority,
  RelationalExecutiveOperationsSeverity,
} from "@prisma/client";

import type { ExecutiveOperationsCorridorContext } from "./relational-executive-operations-corridor-context.service";
import type { ComputedExecutiveOperationsState } from "./relational-executive-operations-engine.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";
import { RelationalExecutiveOperationsPriorityService } from "./relational-executive-operations-priority.service";

export type ExecutiveOperationsMatrixDraft = {
  matrixCode: string;
  matrixType: RelationalExecutiveOperationsMatrixType;
  severity: RelationalExecutiveOperationsSeverity;
  priority: RelationalExecutiveOperationsPriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  executivePressure: number;
};

@Injectable()
export class RelationalExecutiveOperationsMatrixService {
  constructor(
    private readonly policy: RelationalExecutiveOperationsPolicyService,
    private readonly prioritySvc: RelationalExecutiveOperationsPriorityService,
  ) {}

  generateExecutiveOperationsMatrices(
    ctx: ExecutiveOperationsCorridorContext,
    state: ComputedExecutiveOperationsState,
  ): ExecutiveOperationsMatrixDraft[] {
    const types: RelationalExecutiveOperationsMatrixType[] = [
      RelationalExecutiveOperationsMatrixType.EXECUTIVE_OPERATIONS_MATRIX,
      RelationalExecutiveOperationsMatrixType.STRATEGIC_SUPERVISION_MATRIX,
      RelationalExecutiveOperationsMatrixType.SYSTEMIC_CONCENTRATION_MATRIX,
      RelationalExecutiveOperationsMatrixType.TERRITORIAL_OPERATIONS_MATRIX,
      RelationalExecutiveOperationsMatrixType.SECTOR_OPERATIONS_MATRIX,
      RelationalExecutiveOperationsMatrixType.RESILIENCE_OPERATIONS_MATRIX,
      RelationalExecutiveOperationsMatrixType.EXECUTIVE_BALANCE_MATRIX,
    ];
    return types.map((matrixType) => this.buildMatrix(ctx, state, matrixType));
  }

  private buildMatrix(
    ctx: ExecutiveOperationsCorridorContext,
    state: ComputedExecutiveOperationsState,
    matrixType: RelationalExecutiveOperationsMatrixType,
  ): ExecutiveOperationsMatrixDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.3 +
        state.systemicConcentration * 0.35 +
        state.commandPressure * 0.35,
    );
    const { title, summary } = this.templateForType(matrixType, ctx, state);
    return {
      matrixCode: `EXEC_OPS_MATRIX:${matrixType}:${ctx.relationshipId}`,
      matrixType,
      severity,
      priority,
      title,
      summary,
      institutionalPressure,
      executivePressure: state.executivePressure,
    };
  }

  private templateForType(
    matrixType: RelationalExecutiveOperationsMatrixType,
    ctx: ExecutiveOperationsCorridorContext,
    state: ComputedExecutiveOperationsState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (matrixType) {
      case RelationalExecutiveOperationsMatrixType.EXECUTIVE_OPERATIONS_MATRIX:
        return {
          title: `Executive operations matrix — ${territory}`,
          summary: `Operations score ${state.executiveOperationsScore}/100; executive pressure ${state.executivePressure}; urgency ${state.executiveUrgency}. Command pressure ${state.commandPressure}; institutional ${state.institutionalPressure}.`,
        };
      case RelationalExecutiveOperationsMatrixType.STRATEGIC_SUPERVISION_MATRIX:
        return {
          title: `Strategic supervision matrix — ${territory}`,
          summary: `Strategic balance ${state.strategicBalanceScore}/100; resilience ${state.resilienceStrength}; operations score ${state.executiveOperationsScore}. Monitoring ${state.monitoringPressure}; orchestration ${state.orchestrationPressure}.`,
        };
      case RelationalExecutiveOperationsMatrixType.SYSTEMIC_CONCENTRATION_MATRIX:
        return {
          title: `Systemic concentration matrix — ${state.systemicConcentration}`,
          summary: `Systemic concentration ${state.systemicConcentration}/100; executive pressure ${state.executivePressure}; peer corridors ${ctx.peerRelationshipCount}. Escalation: ${state.executiveEscalationDetected ? "yes" : "no"}.`,
        };
      case RelationalExecutiveOperationsMatrixType.TERRITORIAL_OPERATIONS_MATRIX:
        return {
          title: `Territorial operations matrix — ${territory}`,
          summary: `Territory ${territory}: executive pressure ${state.executivePressure}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalExecutiveOperationsMatrixType.SECTOR_OPERATIONS_MATRIX:
        return {
          title: `Sector operations matrix — ${sector}`,
          summary: `Sector ${sector} corridor ${ctx.relationshipId}: operations score ${state.executiveOperationsScore}; macro fragility ${ctx.macroStructuralFragility}.`,
        };
      case RelationalExecutiveOperationsMatrixType.RESILIENCE_OPERATIONS_MATRIX:
        return {
          title: `Resilience operations matrix — strength ${state.resilienceStrength}`,
          summary: `Resilience strength ${state.resilienceStrength}/100; continuity ${ctx.continuityScore}; stabilization pressure ${state.stabilizationPressure}.`,
        };
      case RelationalExecutiveOperationsMatrixType.EXECUTIVE_BALANCE_MATRIX:
        return {
          title: `Executive balance matrix`,
          summary: `Governance pressure ${state.governancePressure}; arbitration ${state.arbitrationPressure}; active governance score ${ctx.activeGovernanceScore}.`,
        };
      default:
        return {
          title: `Executive operations matrix`,
          summary: `Operations score ${state.executiveOperationsScore}; executive pressure ${state.executivePressure}.`,
        };
    }
  }
}
