import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveStrategicSynthesisDigestType,
  RelationalExecutiveStrategicSynthesisPriority,
  RelationalExecutiveStrategicSynthesisSeverity,
} from "@prisma/client";

import type { ExecutiveStrategicSynthesisCorridorContext } from "./relational-executive-strategic-synthesis-corridor-context.service";
import type { ComputedExecutiveStrategicSynthesisState } from "./relational-executive-strategic-synthesis-engine.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";
import { RelationalExecutiveStrategicSynthesisPriorityService } from "./relational-executive-strategic-synthesis-priority.service";

export type ExecutiveStrategicSynthesisDigestDraft = {
  digestCode: string;
  digestType: RelationalExecutiveStrategicSynthesisDigestType;
  severity: RelationalExecutiveStrategicSynthesisSeverity;
  priority: RelationalExecutiveStrategicSynthesisPriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  executiveExposure: number;
};

@Injectable()
export class RelationalExecutiveStrategicSynthesisDigestService {
  constructor(
    private readonly policy: RelationalExecutiveStrategicSynthesisPolicyService,
    private readonly prioritySvc: RelationalExecutiveStrategicSynthesisPriorityService,
  ) {}

  generateExecutiveStrategicSynthesisDigests(
    ctx: ExecutiveStrategicSynthesisCorridorContext,
    state: ComputedExecutiveStrategicSynthesisState,
  ): ExecutiveStrategicSynthesisDigestDraft[] {
    const types: RelationalExecutiveStrategicSynthesisDigestType[] = [
      RelationalExecutiveStrategicSynthesisDigestType.EXECUTIVE_SYNTHESIS_DIGEST,
      RelationalExecutiveStrategicSynthesisDigestType.STRATEGIC_ALIGNMENT_DIGEST,
      RelationalExecutiveStrategicSynthesisDigestType.SYSTEMIC_PRESSURE_DIGEST,
      RelationalExecutiveStrategicSynthesisDigestType.TERRITORIAL_OVERSIGHT_DIGEST,
      RelationalExecutiveStrategicSynthesisDigestType.SECTOR_OVERSIGHT_DIGEST,
      RelationalExecutiveStrategicSynthesisDigestType.RESILIENCE_SYNTHESIS_DIGEST,
      RelationalExecutiveStrategicSynthesisDigestType.EXECUTIVE_BALANCE_DIGEST,
    ];
    return types.map((digestType) => this.buildDigest(ctx, state, digestType));
  }

  private buildDigest(
    ctx: ExecutiveStrategicSynthesisCorridorContext,
    state: ComputedExecutiveStrategicSynthesisState,
    digestType: RelationalExecutiveStrategicSynthesisDigestType,
  ): ExecutiveStrategicSynthesisDigestDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.3 +
        state.systemicPressure * 0.35 +
        state.operationsPressure * 0.35,
    );
    const { title, summary } = this.templateForType(digestType, ctx, state);
    return {
      digestCode: `EXEC_SYNTH_DIGEST:${digestType}:${ctx.relationshipId}`,
      digestType,
      severity,
      priority,
      title,
      summary,
      institutionalPressure,
      executiveExposure: state.executiveExposure,
    };
  }

  private templateForType(
    digestType: RelationalExecutiveStrategicSynthesisDigestType,
    ctx: ExecutiveStrategicSynthesisCorridorContext,
    state: ComputedExecutiveStrategicSynthesisState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (digestType) {
      case RelationalExecutiveStrategicSynthesisDigestType.EXECUTIVE_SYNTHESIS_DIGEST:
        return {
          title: `Executive decision digest — ${territory}`,
          summary: `Control room score ${state.synthesisScore}/100; executive pressure ${state.executiveExposure}; urgency ${state.executiveUrgency}. Operations pressure ${state.operationsPressure}; command ${state.commandPressure}.`,
        };
      case RelationalExecutiveStrategicSynthesisDigestType.STRATEGIC_ALIGNMENT_DIGEST:
        return {
          title: `Strategic command digest — ${territory}`,
          summary: `Strategic balance ${state.strategicAlignmentScore}/100; resilience ${state.resilienceStrength}; control room ${state.synthesisScore}. Monitoring ${state.monitoringPressure}; orchestration ${state.orchestrationPressure}.`,
        };
      case RelationalExecutiveStrategicSynthesisDigestType.SYSTEMIC_PRESSURE_DIGEST:
        return {
          title: `Systemic pressure digest — ${state.systemicPressure}`,
          summary: `Systemic concentration ${state.systemicPressure}/100; executive pressure ${state.executiveExposure}; peer corridors ${ctx.peerRelationshipCount}. Escalation: ${state.executiveInstabilityDetected ? "yes" : "no"}.`,
        };
      case RelationalExecutiveStrategicSynthesisDigestType.TERRITORIAL_OVERSIGHT_DIGEST:
        return {
          title: `Territorial supervision digest — ${territory}`,
          summary: `Territory ${territory}: executive pressure ${state.executiveExposure}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalExecutiveStrategicSynthesisDigestType.SECTOR_OVERSIGHT_DIGEST:
        return {
          title: `Sector supervision digest — ${sector}`,
          summary: `Sector ${sector} corridor ${ctx.relationshipId}: control room score ${state.synthesisScore}; macro fragility ${ctx.macroStructuralFragility}.`,
        };
      case RelationalExecutiveStrategicSynthesisDigestType.RESILIENCE_SYNTHESIS_DIGEST:
        return {
          title: `Resilience supervision digest — strength ${state.resilienceStrength}`,
          summary: `Resilience strength ${state.resilienceStrength}/100; continuity ${ctx.continuityScore}; stabilization pressure ${state.stabilizationPressure}.`,
        };
      case RelationalExecutiveStrategicSynthesisDigestType.EXECUTIVE_BALANCE_DIGEST:
        return {
          title: `Executive balance digest`,
          summary: `Governance pressure ${state.governancePressure}; arbitration ${state.arbitrationPressure}; active governance score ${ctx.activeGovernanceScore}.`,
        };
      default:
        return {
          title: `Executive control room digest`,
          summary: `Control room score ${state.synthesisScore}; executive pressure ${state.executiveExposure}.`,
        };
    }
  }
}
