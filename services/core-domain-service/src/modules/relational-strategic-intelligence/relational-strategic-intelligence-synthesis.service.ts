import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicIntelligencePriority,
  RelationalStrategicIntelligenceSeverity,
  RelationalStrategicIntelligenceSynthesisType,
} from "@prisma/client";

import type { StrategicIntelligenceCorridorContext } from "./relational-strategic-intelligence-corridor-context.service";
import type { ComputedStrategicIntelligenceState } from "./relational-strategic-intelligence-engine.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";
import { RelationalStrategicIntelligencePriorityService } from "./relational-strategic-intelligence-priority.service";

export type StrategicIntelligenceSynthesisDraft = {
  synthesisCode: string;
  synthesisType: RelationalStrategicIntelligenceSynthesisType;
  severity: RelationalStrategicIntelligenceSeverity;
  priority: RelationalStrategicIntelligencePriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  systemicConcentration: number;
};

@Injectable()
export class RelationalStrategicIntelligenceSynthesisService {
  constructor(
    private readonly policy: RelationalStrategicIntelligencePolicyService,
    private readonly prioritySvc: RelationalStrategicIntelligencePriorityService,
  ) {}

  generateStrategicSyntheses(
    ctx: StrategicIntelligenceCorridorContext,
    state: ComputedStrategicIntelligenceState,
  ): StrategicIntelligenceSynthesisDraft[] {
    const types: RelationalStrategicIntelligenceSynthesisType[] = [
      RelationalStrategicIntelligenceSynthesisType.EXECUTIVE_SYNTHESIS,
      RelationalStrategicIntelligenceSynthesisType.STRATEGIC_SYNTHESIS,
      RelationalStrategicIntelligenceSynthesisType.TERRITORIAL_SYNTHESIS,
      RelationalStrategicIntelligenceSynthesisType.SECTOR_SYNTHESIS,
      RelationalStrategicIntelligenceSynthesisType.SYSTEMIC_SYNTHESIS,
      RelationalStrategicIntelligenceSynthesisType.RESILIENCE_SYNTHESIS,
      RelationalStrategicIntelligenceSynthesisType.GOVERNANCE_SYNTHESIS,
    ];
    return types.map((synthesisType) => this.buildSynthesis(ctx, state, synthesisType));
  }

  private buildSynthesis(
    ctx: StrategicIntelligenceCorridorContext,
    state: ComputedStrategicIntelligenceState,
    synthesisType: RelationalStrategicIntelligenceSynthesisType,
  ): StrategicIntelligenceSynthesisDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.35 + state.executiveExposure * 0.35 + state.orchestrationPressure * 0.3,
    );
    const { title, summary } = this.templateForType(synthesisType, ctx, state);
    return {
      synthesisCode: `STRAT_INTEL_SYN:${synthesisType}:${ctx.relationshipId}`,
      synthesisType,
      severity,
      priority,
      title,
      summary,
      institutionalPressure,
      systemicConcentration: state.systemicConcentration,
    };
  }

  private templateForType(
    synthesisType: RelationalStrategicIntelligenceSynthesisType,
    ctx: StrategicIntelligenceCorridorContext,
    state: ComputedStrategicIntelligenceState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (synthesisType) {
      case RelationalStrategicIntelligenceSynthesisType.EXECUTIVE_SYNTHESIS:
        return {
          title: `Executive synthesis — ${territory}`,
          summary: `Strategic intelligence score ${state.strategicIntelligenceScore}/100; executive exposure ${state.executiveExposure}; urgency ${state.executiveUrgency}. Institutional pressure ${state.institutionalPressure}; baseline institutional ${ctx.topInstitutionalScore}.`,
        };
      case RelationalStrategicIntelligenceSynthesisType.STRATEGIC_SYNTHESIS:
        return {
          title: `Strategic alignment synthesis — ${territory}`,
          summary: `Strategic alignment ${state.strategicAlignmentScore}/100; resilience strength ${state.resilienceStrength}; intelligence score ${state.strategicIntelligenceScore}. Monitoring pressure ${state.monitoringPressure}; recovery pressure ${state.recoveryPressure}.`,
        };
      case RelationalStrategicIntelligenceSynthesisType.TERRITORIAL_SYNTHESIS:
        return {
          title: `Territorial consolidation synthesis — ${territory}`,
          summary: `Territory ${territory}: systemic concentration ${state.systemicConcentration}; peer corridors ${ctx.peerRelationshipCount}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalStrategicIntelligenceSynthesisType.SECTOR_SYNTHESIS:
        return {
          title: `Sector consolidation synthesis — ${sector}`,
          summary: `Sector ${sector} on corridor ${ctx.relationshipId}: intelligence score ${state.strategicIntelligenceScore}; macro fragility ${ctx.macroStructuralFragility}; supply disruption avg ${ctx.supplyFlowDisruptionAvg}.`,
        };
      case RelationalStrategicIntelligenceSynthesisType.SYSTEMIC_SYNTHESIS:
        return {
          title: `Systemic synthesis — concentration ${state.systemicConcentration}`,
          summary: `Systemic concentration ${state.systemicConcentration}/100; executive exposure ${state.executiveExposure}; governance conflicts ${ctx.governanceConflictCount}. Detected: ${state.systemicPressureDetected ? "yes" : "no"}.`,
        };
      case RelationalStrategicIntelligenceSynthesisType.RESILIENCE_SYNTHESIS:
        return {
          title: `Resilience synthesis — strength ${state.resilienceStrength}`,
          summary: `Resilience strength ${state.resilienceStrength}/100; continuity ${ctx.continuityScore}; stabilization pressure ${state.stabilizationPressure}. Recovery pressure ${state.recoveryPressure}.`,
        };
      case RelationalStrategicIntelligenceSynthesisType.GOVERNANCE_SYNTHESIS:
        return {
          title: `Governance consolidation synthesis`,
          summary: `Governance pressure ${state.governancePressure}; arbitration ${state.arbitrationPressure}; active governance score ${ctx.activeGovernanceScore}. Conflict peak ${ctx.topConflictPressure}.`,
        };
      default:
        return {
          title: `Strategic intelligence synthesis`,
          summary: `Intelligence score ${state.strategicIntelligenceScore}; executive exposure ${state.executiveExposure}.`,
        };
    }
  }
}
