import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicObservatoryGridType,
  RelationalStrategicObservatoryPriority,
  RelationalStrategicObservatorySeverity,
} from "@prisma/client";

import type { StrategicObservatoryCorridorContext } from "./relational-strategic-observatory-corridor-context.service";
import type { ComputedStrategicObservatoryState } from "./relational-strategic-observatory-engine.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";
import { RelationalStrategicObservatoryPriorityService } from "./relational-strategic-observatory-priority.service";

export type StrategicObservatoryGridDraft = {
  gridCode: string;
  gridType: RelationalStrategicObservatoryGridType;
  severity: RelationalStrategicObservatorySeverity;
  priority: RelationalStrategicObservatoryPriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  executiveExposure: number;
};

@Injectable()
export class RelationalStrategicObservatoryGridService {
  constructor(
    private readonly policy: RelationalStrategicObservatoryPolicyService,
    private readonly prioritySvc: RelationalStrategicObservatoryPriorityService,
  ) {}

  generateStrategicObservatoryGrids(
    ctx: StrategicObservatoryCorridorContext,
    state: ComputedStrategicObservatoryState,
  ): StrategicObservatoryGridDraft[] {
    const types: RelationalStrategicObservatoryGridType[] = [
      RelationalStrategicObservatoryGridType.GLOBAL_STRATEGIC_OBSERVATORY_GRID,
      RelationalStrategicObservatoryGridType.EXECUTIVE_PRESSURE_GRID,
      RelationalStrategicObservatoryGridType.SYSTEMIC_CONCENTRATION_GRID,
      RelationalStrategicObservatoryGridType.TERRITORIAL_COORDINATION_GRID,
      RelationalStrategicObservatoryGridType.SECTOR_COORDINATION_GRID,
      RelationalStrategicObservatoryGridType.RESILIENCE_COORDINATION_GRID,
      RelationalStrategicObservatoryGridType.EXECUTIVE_ALIGNMENT_GRID,
    ];
    return types.map((gridType) => this.buildGrid(ctx, state, gridType));
  }

  private buildGrid(
    ctx: StrategicObservatoryCorridorContext,
    state: ComputedStrategicObservatoryState,
    gridType: RelationalStrategicObservatoryGridType,
  ): StrategicObservatoryGridDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.3 +
        state.systemicPressure * 0.35 +
        state.operationsPressure * 0.35,
    );
    const { title, summary } = this.templateForType(gridType, ctx, state);
    return {
      gridCode: `STRAT_OBSERV_GRID:${gridType}:${ctx.relationshipId}`,
      gridType,
      severity,
      priority,
      title,
      summary,
      institutionalPressure,
      executiveExposure: state.executiveExposure,
    };
  }

  private templateForType(
    gridType: RelationalStrategicObservatoryGridType,
    ctx: StrategicObservatoryCorridorContext,
    state: ComputedStrategicObservatoryState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (gridType) {
      case RelationalStrategicObservatoryGridType.GLOBAL_STRATEGIC_OBSERVATORY_GRID:
        return {
          title: `Global strategic observatory grid — ${territory}`,
          summary: `Observatory score ${state.observatoryScore}/100; executive exposure ${state.executiveExposure}; coordination ${state.strategicCoordinationPressure}.`,
        };
      case RelationalStrategicObservatoryGridType.EXECUTIVE_PRESSURE_GRID:
        return {
          title: `Executive pressure grid — ${territory}`,
          summary: `Executive exposure ${state.executiveExposure}/100; urgency ${state.executiveUrgency}; global supervision ${ctx.topGlobalExecutiveSupervisionScore}.`,
        };
      case RelationalStrategicObservatoryGridType.SYSTEMIC_CONCENTRATION_GRID:
        return {
          title: `Systemic concentration grid — ${state.systemicPressure}`,
          summary: `Systemic pressure ${state.systemicPressure}/100; exposure ${state.executiveExposure}; peer corridors ${ctx.peerRelationshipCount}. Instability: ${state.executiveInstabilityDetected ? "yes" : "no"}.`,
        };
      case RelationalStrategicObservatoryGridType.TERRITORIAL_COORDINATION_GRID:
        return {
          title: `Territorial coordination grid — ${territory}`,
          summary: `Territory ${territory}: executive exposure ${state.executiveExposure}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalStrategicObservatoryGridType.SECTOR_COORDINATION_GRID:
        return {
          title: `Sector coordination grid — ${sector}`,
          summary: `Sector ${sector} corridor ${ctx.relationshipId}: observatory score ${state.observatoryScore}; macro fragility ${ctx.macroStructuralFragility}.`,
        };
      case RelationalStrategicObservatoryGridType.RESILIENCE_COORDINATION_GRID:
        return {
          title: `Resilience coordination grid — strength ${state.resilienceStrength}`,
          summary: `Resilience strength ${state.resilienceStrength}/100; continuity ${ctx.continuityScore}; stabilization pressure ${state.stabilizationPressure}.`,
        };
      case RelationalStrategicObservatoryGridType.EXECUTIVE_ALIGNMENT_GRID:
        return {
          title: `Executive balance grid`,
          summary: `Governance pressure ${state.governancePressure}; arbitration ${state.arbitrationPressure}; active governance score ${ctx.activeGovernanceScore}.`,
        };
      default:
        return {
          title: `Executive control room grid`,
          summary: `Control room score ${state.observatoryScore}; executive pressure ${state.executiveExposure}.`,
        };
    }
  }
}
