import { Injectable } from "@nestjs/common";
import {
  RelationalGlobalExecutiveSupervisionMatrixType,
  RelationalGlobalExecutiveSupervisionPriority,
  RelationalGlobalExecutiveSupervisionSeverity,
} from "@prisma/client";

import type { GlobalExecutiveSupervisionCorridorContext } from "./relational-global-executive-supervision-corridor-context.service";
import type { ComputedGlobalExecutiveSupervisionState } from "./relational-global-executive-supervision-engine.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";
import { RelationalGlobalExecutiveSupervisionPriorityService } from "./relational-global-executive-supervision-priority.service";

export type GlobalExecutiveSupervisionMatrixDraft = {
  matrixCode: string;
  matrixType: RelationalGlobalExecutiveSupervisionMatrixType;
  severity: RelationalGlobalExecutiveSupervisionSeverity;
  priority: RelationalGlobalExecutiveSupervisionPriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  executivePressure: number;
};

@Injectable()
export class RelationalGlobalExecutiveSupervisionMatrixService {
  constructor(
    private readonly policy: RelationalGlobalExecutiveSupervisionPolicyService,
    private readonly prioritySvc: RelationalGlobalExecutiveSupervisionPriorityService,
  ) {}

  generateGlobalExecutiveSupervisionMatrices(
    ctx: GlobalExecutiveSupervisionCorridorContext,
    state: ComputedGlobalExecutiveSupervisionState,
  ): GlobalExecutiveSupervisionMatrixDraft[] {
    const types: RelationalGlobalExecutiveSupervisionMatrixType[] = [
      RelationalGlobalExecutiveSupervisionMatrixType.GLOBAL_EXECUTIVE_SUPERVISION_MATRIX,
      RelationalGlobalExecutiveSupervisionMatrixType.STRATEGIC_NETWORK_MATRIX,
      RelationalGlobalExecutiveSupervisionMatrixType.SYSTEMIC_PRESSURE_MATRIX,
      RelationalGlobalExecutiveSupervisionMatrixType.TERRITORIAL_SUPERVISION_MATRIX,
      RelationalGlobalExecutiveSupervisionMatrixType.SECTOR_SUPERVISION_MATRIX,
      RelationalGlobalExecutiveSupervisionMatrixType.RESILIENCE_SUPERVISION_MATRIX,
      RelationalGlobalExecutiveSupervisionMatrixType.EXECUTIVE_BALANCE_MATRIX,
    ];
    return types.map((matrixType) => this.buildMatrix(ctx, state, matrixType));
  }

  private buildMatrix(
    ctx: GlobalExecutiveSupervisionCorridorContext,
    state: ComputedGlobalExecutiveSupervisionState,
    matrixType: RelationalGlobalExecutiveSupervisionMatrixType,
  ): GlobalExecutiveSupervisionMatrixDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.3 +
        state.systemicExposure * 0.35 +
        state.operationsPressure * 0.35,
    );
    const { title, summary } = this.templateForType(matrixType, ctx, state);
    return {
      matrixCode: `EXEC_SUPERV_MATRIX:${matrixType}:${ctx.relationshipId}`,
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
    matrixType: RelationalGlobalExecutiveSupervisionMatrixType,
    ctx: GlobalExecutiveSupervisionCorridorContext,
    state: ComputedGlobalExecutiveSupervisionState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (matrixType) {
      case RelationalGlobalExecutiveSupervisionMatrixType.GLOBAL_EXECUTIVE_SUPERVISION_MATRIX:
        return {
          title: `Global executive supervision matrix — ${territory}`,
          summary: `Control room score ${state.supervisionScore}/100; executive pressure ${state.executivePressure}; urgency ${state.executiveUrgency}. Operations pressure ${state.operationsPressure}; command ${state.commandPressure}.`,
        };
      case RelationalGlobalExecutiveSupervisionMatrixType.STRATEGIC_NETWORK_MATRIX:
        return {
          title: `Strategic network matrix — ${territory}`,
          summary: `Strategic balance ${state.strategicAlignmentScore}/100; resilience ${state.resilienceStrength}; control room ${state.supervisionScore}. Monitoring ${state.monitoringPressure}; orchestration ${state.orchestrationPressure}.`,
        };
      case RelationalGlobalExecutiveSupervisionMatrixType.SYSTEMIC_PRESSURE_MATRIX:
        return {
          title: `Systemic pressure matrix — ${state.systemicExposure}`,
          summary: `Systemic concentration ${state.systemicExposure}/100; executive pressure ${state.executivePressure}; peer corridors ${ctx.peerRelationshipCount}. Escalation: ${state.executiveEscalationDetected ? "yes" : "no"}.`,
        };
      case RelationalGlobalExecutiveSupervisionMatrixType.TERRITORIAL_SUPERVISION_MATRIX:
        return {
          title: `Territorial supervision matrix — ${territory}`,
          summary: `Territory ${territory}: executive pressure ${state.executivePressure}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalGlobalExecutiveSupervisionMatrixType.SECTOR_SUPERVISION_MATRIX:
        return {
          title: `Sector supervision matrix — ${sector}`,
          summary: `Sector ${sector} corridor ${ctx.relationshipId}: control room score ${state.supervisionScore}; macro fragility ${ctx.macroStructuralFragility}.`,
        };
      case RelationalGlobalExecutiveSupervisionMatrixType.RESILIENCE_SUPERVISION_MATRIX:
        return {
          title: `Resilience supervision matrix — strength ${state.resilienceStrength}`,
          summary: `Resilience strength ${state.resilienceStrength}/100; continuity ${ctx.continuityScore}; stabilization pressure ${state.stabilizationPressure}.`,
        };
      case RelationalGlobalExecutiveSupervisionMatrixType.EXECUTIVE_BALANCE_MATRIX:
        return {
          title: `Executive balance matrix`,
          summary: `Governance pressure ${state.governancePressure}; arbitration ${state.arbitrationPressure}; active governance score ${ctx.activeGovernanceScore}.`,
        };
      default:
        return {
          title: `Executive control room matrix`,
          summary: `Control room score ${state.supervisionScore}; executive pressure ${state.executivePressure}.`,
        };
    }
  }
}
