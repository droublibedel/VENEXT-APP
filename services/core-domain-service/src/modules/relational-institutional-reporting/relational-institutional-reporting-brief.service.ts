import { Injectable } from "@nestjs/common";
import {
  RelationalInstitutionalReportingBriefType,
  RelationalInstitutionalReportingPriority,
  RelationalInstitutionalReportingSeverity,
} from "@prisma/client";

import type { InstitutionalReportingCorridorContext } from "./relational-institutional-reporting-corridor-context.service";
import type { ComputedInstitutionalReportingState } from "./relational-institutional-reporting-engine.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";
import { RelationalInstitutionalReportingPriorityService } from "./relational-institutional-reporting-priority.service";

export type InstitutionalReportingBriefDraft = {
  briefCode: string;
  briefType: RelationalInstitutionalReportingBriefType;
  severity: RelationalInstitutionalReportingSeverity;
  priority: RelationalInstitutionalReportingPriority;
  title: string;
  summary: string;
  institutionalPressure: number;
  systemicExposure: number;
};

@Injectable()
export class RelationalInstitutionalReportingBriefService {
  constructor(
    private readonly policy: RelationalInstitutionalReportingPolicyService,
    private readonly prioritySvc: RelationalInstitutionalReportingPriorityService,
  ) {}

  generateInstitutionalBriefs(
    ctx: InstitutionalReportingCorridorContext,
    state: ComputedInstitutionalReportingState,
  ): InstitutionalReportingBriefDraft[] {
    const types: RelationalInstitutionalReportingBriefType[] = [
      RelationalInstitutionalReportingBriefType.EXECUTIVE_BRIEF,
      RelationalInstitutionalReportingBriefType.STRATEGIC_BRIEF,
      RelationalInstitutionalReportingBriefType.TERRITORIAL_BRIEF,
      RelationalInstitutionalReportingBriefType.SECTOR_BRIEF,
      RelationalInstitutionalReportingBriefType.SYSTEMIC_RISK_BRIEF,
      RelationalInstitutionalReportingBriefType.RESILIENCE_BRIEF,
      RelationalInstitutionalReportingBriefType.GOVERNANCE_BRIEF,
    ];
    return types.map((briefType) => this.buildBrief(ctx, state, briefType));
  }

  private buildBrief(
    ctx: InstitutionalReportingCorridorContext,
    state: ComputedInstitutionalReportingState,
    briefType: RelationalInstitutionalReportingBriefType,
  ): InstitutionalReportingBriefDraft {
    const severity = this.prioritySvc.toSeverity(state.executiveUrgency);
    const priority = this.prioritySvc.toPriority(state.executiveUrgency);
    const institutionalPressure = this.policy.clampInt(
      state.governancePressure * 0.35 + state.executiveRisk * 0.35 + state.orchestrationPressure * 0.3,
    );
    const { title, summary } = this.templateForType(briefType, ctx, state);
    return {
      briefCode: `INST_REP_BRIEF:${briefType}:${ctx.relationshipId}`,
      briefType,
      severity,
      priority,
      title,
      summary,
      institutionalPressure,
      systemicExposure: state.systemicExposure,
    };
  }

  private templateForType(
    briefType: RelationalInstitutionalReportingBriefType,
    ctx: InstitutionalReportingCorridorContext,
    state: ComputedInstitutionalReportingState,
  ): { title: string; summary: string } {
    const territory = `${ctx.territoryCountry}/${ctx.territoryCity}`;
    const sector = ctx.sectorSlug ?? "general";
    switch (briefType) {
      case RelationalInstitutionalReportingBriefType.EXECUTIVE_BRIEF:
        return {
          title: `Executive institutional brief — ${territory}`,
          summary: `Institutional score ${state.institutionalScore}/100; executive risk ${state.executiveRisk}; urgency ${state.executiveUrgency}. Orchestration pressure ${state.orchestrationPressure}; coordination baseline ${ctx.topExecutiveCoordinationPressure}.`,
        };
      case RelationalInstitutionalReportingBriefType.STRATEGIC_BRIEF:
        return {
          title: `Strategic alignment brief — ${territory}`,
          summary: `Strategic alignment ${state.strategicAlignmentScore}/100; resilience ${state.strategicResilience}; institutional score ${state.institutionalScore}. Monitoring pressure ${state.monitoringPressure}; recovery pressure ${state.recoveryPressure}.`,
        };
      case RelationalInstitutionalReportingBriefType.TERRITORIAL_BRIEF:
        return {
          title: `Territorial corridor brief — ${territory}`,
          summary: `Territory ${territory}: systemic exposure ${state.systemicExposure}; peer corridors ${ctx.peerRelationshipCount}; sovereignty pressure ${state.sovereigntyPressure}.`,
        };
      case RelationalInstitutionalReportingBriefType.SECTOR_BRIEF:
        return {
          title: `Sector intelligence brief — ${sector}`,
          summary: `Sector ${sector} on corridor ${ctx.relationshipId}: institutional score ${state.institutionalScore}; macro fragility context ${ctx.macroStructuralFragility}; supply disruption avg ${ctx.supplyFlowDisruptionAvg}.`,
        };
      case RelationalInstitutionalReportingBriefType.SYSTEMIC_RISK_BRIEF:
        return {
          title: `Systemic risk brief — exposure ${state.systemicExposure}`,
          summary: `Systemic exposure ${state.systemicExposure}/100; executive risk ${state.executiveRisk}; governance conflicts ${ctx.governanceConflictCount}. Detected: ${state.systemicRiskDetected ? "yes" : "no"}.`,
        };
      case RelationalInstitutionalReportingBriefType.RESILIENCE_BRIEF:
        return {
          title: `Resilience brief — score ${state.strategicResilience}`,
          summary: `Strategic resilience ${state.strategicResilience}/100; continuity ${ctx.continuityScore}; stabilization pressure ${state.stabilizationPressure}. Recovery pressure ${state.recoveryPressure}.`,
        };
      case RelationalInstitutionalReportingBriefType.GOVERNANCE_BRIEF:
        return {
          title: `Governance pressure brief`,
          summary: `Governance pressure ${state.governancePressure}; arbitration ${state.arbitrationPressure}; active governance score ${ctx.activeGovernanceScore}. Conflict pressure peak ${ctx.topConflictPressure}.`,
        };
      default:
        return {
          title: `Institutional reporting brief`,
          summary: `Institutional score ${state.institutionalScore}; executive risk ${state.executiveRisk}.`,
        };
    }
  }
}
