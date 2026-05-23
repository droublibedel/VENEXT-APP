import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicCommandGridType,
  RelationalStrategicCommandPriority,
  RelationalStrategicCommandSeverity,
} from "@prisma/client";

import type { StrategicCommandCorridorContext } from "./relational-strategic-command-corridor-context.service";
import type { ComputedStrategicCommandState } from "./relational-strategic-command-engine.service";
import { RelationalStrategicCommandPolicyService } from "./relational-strategic-command-policy.service";
import { RelationalStrategicCommandPriorityService } from "./relational-strategic-command-priority.service";

export type StrategicCommandGridDraft = {
  gridCode: string;
  gridType: RelationalStrategicCommandGridType;
  severity: RelationalStrategicCommandSeverity;
  priority: RelationalStrategicCommandPriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  systemicPressure: number;
};

@Injectable()
export class RelationalStrategicCommandGridService {
  constructor(
    private readonly policy: RelationalStrategicCommandPolicyService,
    private readonly prioritySvc: RelationalStrategicCommandPriorityService,
  ) {}

  generateStrategicCommandGrids(
    ctx: StrategicCommandCorridorContext,
    state: ComputedStrategicCommandState,
  ): StrategicCommandGridDraft[] {
    const types: RelationalStrategicCommandGridType[] = [
      RelationalStrategicCommandGridType.EXECUTIVE_COMMAND_GRID,
      RelationalStrategicCommandGridType.STRATEGIC_SUPERVISION_GRID,
      RelationalStrategicCommandGridType.SYSTEMIC_PRESSURE_GRID,
      RelationalStrategicCommandGridType.TERRITORIAL_GRID,
      RelationalStrategicCommandGridType.SECTOR_GRID,
      RelationalStrategicCommandGridType.RESILIENCE_GRID,
      RelationalStrategicCommandGridType.GOVERNANCE_GRID,
    ];
    return types.map((gridType) => this.buildGrid(ctx, state, gridType));
  }

  private buildGrid(
    ctx: StrategicCommandCorridorContext,
    state: ComputedStrategicCommandState,
    gridType: RelationalStrategicCommandGridType,
  ): StrategicCommandGridDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.3 + state.executiveConcentration * 0.35 + state.intelligencePressure * 0.35,
    );
    const { title, summary } = this.templateForType(gridType, ctx, state);
    return {
      gridCode: `STRAT_CMD_GRID:${gridType}:${ctx.relationshipId}`,
      gridType,
      severity,
      priority,
      title,
      summary,
      institutionalPressure,
      systemicPressure: state.systemicPressure,
    };
  }

  private templateForType(
    gridType: RelationalStrategicCommandGridType,
    ctx: StrategicCommandCorridorContext,
    state: ComputedStrategicCommandState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (gridType) {
      case RelationalStrategicCommandGridType.EXECUTIVE_COMMAND_GRID:
        return {
          title: `Executive command grid — ${territory}`,
          summary: `Command score ${state.commandScore}/100; executive concentration ${state.executiveConcentration}; urgency ${state.executiveUrgency}. Intelligence pressure ${state.intelligencePressure}; institutional ${state.institutionalPressure}.`,
        };
      case RelationalStrategicCommandGridType.STRATEGIC_SUPERVISION_GRID:
        return {
          title: `Strategic supervision grid — ${territory}`,
          summary: `Strategic balance ${state.strategicBalanceScore}/100; resilience ${state.resilienceStrength}; command score ${state.commandScore}. Monitoring ${state.monitoringPressure}; orchestration ${state.orchestrationPressure}.`,
        };
      case RelationalStrategicCommandGridType.SYSTEMIC_PRESSURE_GRID:
        return {
          title: `Systemic pressure grid — ${state.systemicPressure}`,
          summary: `Systemic pressure ${state.systemicPressure}/100; executive concentration ${state.executiveConcentration}; peer corridors ${ctx.peerRelationshipCount}. Escalation: ${state.systemicEscalationDetected ? "yes" : "no"}.`,
        };
      case RelationalStrategicCommandGridType.TERRITORIAL_GRID:
        return {
          title: `Territorial supervision grid — ${territory}`,
          summary: `Territory ${territory}: systemic pressure ${state.systemicPressure}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalStrategicCommandGridType.SECTOR_GRID:
        return {
          title: `Sector command grid — ${sector}`,
          summary: `Sector ${sector} corridor ${ctx.relationshipId}: command score ${state.commandScore}; macro fragility ${ctx.macroStructuralFragility}.`,
        };
      case RelationalStrategicCommandGridType.RESILIENCE_GRID:
        return {
          title: `Resilience grid — strength ${state.resilienceStrength}`,
          summary: `Resilience strength ${state.resilienceStrength}/100; continuity ${ctx.continuityScore}; stabilization pressure ${state.stabilizationPressure}.`,
        };
      case RelationalStrategicCommandGridType.GOVERNANCE_GRID:
        return {
          title: `Governance supervision grid`,
          summary: `Governance pressure ${state.governancePressure}; arbitration ${state.arbitrationPressure}; active governance score ${ctx.activeGovernanceScore}.`,
        };
      default:
        return {
          title: `Strategic command grid`,
          summary: `Command score ${state.commandScore}; systemic pressure ${state.systemicPressure}.`,
        };
    }
  }
}
