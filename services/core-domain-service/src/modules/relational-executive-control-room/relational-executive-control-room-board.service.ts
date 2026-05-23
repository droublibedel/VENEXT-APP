import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveControlRoomBoardType,
  RelationalExecutiveControlRoomPriority,
  RelationalExecutiveControlRoomSeverity,
} from "@prisma/client";

import type { ExecutiveControlRoomCorridorContext } from "./relational-executive-control-room-corridor-context.service";
import type { ComputedExecutiveControlRoomState } from "./relational-executive-control-room-engine.service";
import { RelationalExecutiveControlRoomPolicyService } from "./relational-executive-control-room-policy.service";
import { RelationalExecutiveControlRoomPriorityService } from "./relational-executive-control-room-priority.service";

export type ExecutiveControlRoomBoardDraft = {
  boardCode: string;
  boardType: RelationalExecutiveControlRoomBoardType;
  severity: RelationalExecutiveControlRoomSeverity;
  priority: RelationalExecutiveControlRoomPriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  executivePressure: number;
};

@Injectable()
export class RelationalExecutiveControlRoomBoardService {
  constructor(
    private readonly policy: RelationalExecutiveControlRoomPolicyService,
    private readonly prioritySvc: RelationalExecutiveControlRoomPriorityService,
  ) {}

  generateExecutiveControlRoomBoards(
    ctx: ExecutiveControlRoomCorridorContext,
    state: ComputedExecutiveControlRoomState,
  ): ExecutiveControlRoomBoardDraft[] {
    const types: RelationalExecutiveControlRoomBoardType[] = [
      RelationalExecutiveControlRoomBoardType.EXECUTIVE_DECISION_BOARD,
      RelationalExecutiveControlRoomBoardType.STRATEGIC_COMMAND_BOARD,
      RelationalExecutiveControlRoomBoardType.SYSTEMIC_PRESSURE_BOARD,
      RelationalExecutiveControlRoomBoardType.TERRITORIAL_SUPERVISION_BOARD,
      RelationalExecutiveControlRoomBoardType.SECTOR_SUPERVISION_BOARD,
      RelationalExecutiveControlRoomBoardType.RESILIENCE_SUPERVISION_BOARD,
      RelationalExecutiveControlRoomBoardType.EXECUTIVE_BALANCE_BOARD,
    ];
    return types.map((boardType) => this.buildBoard(ctx, state, boardType));
  }

  private buildBoard(
    ctx: ExecutiveControlRoomCorridorContext,
    state: ComputedExecutiveControlRoomState,
    boardType: RelationalExecutiveControlRoomBoardType,
  ): ExecutiveControlRoomBoardDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.3 +
        state.systemicConcentration * 0.35 +
        state.operationsPressure * 0.35,
    );
    const { title, summary } = this.templateForType(boardType, ctx, state);
    return {
      boardCode: `EXEC_CTRL_BOARD:${boardType}:${ctx.relationshipId}`,
      boardType,
      severity,
      priority,
      title,
      summary,
      institutionalPressure,
      executivePressure: state.executivePressure,
    };
  }

  private templateForType(
    boardType: RelationalExecutiveControlRoomBoardType,
    ctx: ExecutiveControlRoomCorridorContext,
    state: ComputedExecutiveControlRoomState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (boardType) {
      case RelationalExecutiveControlRoomBoardType.EXECUTIVE_DECISION_BOARD:
        return {
          title: `Executive decision board — ${territory}`,
          summary: `Control room score ${state.controlRoomScore}/100; executive pressure ${state.executivePressure}; urgency ${state.executiveUrgency}. Operations pressure ${state.operationsPressure}; command ${state.commandPressure}.`,
        };
      case RelationalExecutiveControlRoomBoardType.STRATEGIC_COMMAND_BOARD:
        return {
          title: `Strategic command board — ${territory}`,
          summary: `Strategic balance ${state.strategicBalanceScore}/100; resilience ${state.resilienceStrength}; control room ${state.controlRoomScore}. Monitoring ${state.monitoringPressure}; orchestration ${state.orchestrationPressure}.`,
        };
      case RelationalExecutiveControlRoomBoardType.SYSTEMIC_PRESSURE_BOARD:
        return {
          title: `Systemic pressure board — ${state.systemicConcentration}`,
          summary: `Systemic concentration ${state.systemicConcentration}/100; executive pressure ${state.executivePressure}; peer corridors ${ctx.peerRelationshipCount}. Escalation: ${state.executiveEscalationDetected ? "yes" : "no"}.`,
        };
      case RelationalExecutiveControlRoomBoardType.TERRITORIAL_SUPERVISION_BOARD:
        return {
          title: `Territorial supervision board — ${territory}`,
          summary: `Territory ${territory}: executive pressure ${state.executivePressure}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalExecutiveControlRoomBoardType.SECTOR_SUPERVISION_BOARD:
        return {
          title: `Sector supervision board — ${sector}`,
          summary: `Sector ${sector} corridor ${ctx.relationshipId}: control room score ${state.controlRoomScore}; macro fragility ${ctx.macroStructuralFragility}.`,
        };
      case RelationalExecutiveControlRoomBoardType.RESILIENCE_SUPERVISION_BOARD:
        return {
          title: `Resilience supervision board — strength ${state.resilienceStrength}`,
          summary: `Resilience strength ${state.resilienceStrength}/100; continuity ${ctx.continuityScore}; stabilization pressure ${state.stabilizationPressure}.`,
        };
      case RelationalExecutiveControlRoomBoardType.EXECUTIVE_BALANCE_BOARD:
        return {
          title: `Executive balance board`,
          summary: `Governance pressure ${state.governancePressure}; arbitration ${state.arbitrationPressure}; active governance score ${ctx.activeGovernanceScore}.`,
        };
      default:
        return {
          title: `Executive control room board`,
          summary: `Control room score ${state.controlRoomScore}; executive pressure ${state.executivePressure}.`,
        };
    }
  }
}
