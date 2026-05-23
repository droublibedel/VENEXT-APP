import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalInstitutionalReportingEventType,
  RelationalInstitutionalReportingSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalInstitutionalReportingBriefService } from "./relational-institutional-reporting-brief.service";
import { RelationalInstitutionalReportingCorridorContextService } from "./relational-institutional-reporting-corridor-context.service";
import { RelationalInstitutionalReportingEngineService } from "./relational-institutional-reporting-engine.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";
import { RelationalInstitutionalReportingRealtimeService } from "./relational-institutional-reporting-realtime.service";
import { RelationalStrategicIntelligenceIngestionService } from "../relational-strategic-intelligence/relational-strategic-intelligence-ingestion.service";

@Injectable()
export class RelationalInstitutionalReportingIngestionService {
  private readonly log = new Logger(RelationalInstitutionalReportingIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalInstitutionalReportingPolicyService,
    private readonly corridorContext: RelationalInstitutionalReportingCorridorContextService,
    private readonly engine: RelationalInstitutionalReportingEngineService,
    private readonly briefSvc: RelationalInstitutionalReportingBriefService,
    private readonly realtime: RelationalInstitutionalReportingRealtimeService,
    private readonly strategicIntelligenceIngestion: RelationalStrategicIntelligenceIngestionService,
  ) {}

  private async reportingEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_institutional_reporting_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_institutional_reporting_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.35 — chained after executive orchestration (20.34). */
  async syncInstitutionalReportingState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "institutional_reporting_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.reportingEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true, requesterOrganizationId: true, receiverOrganizationId: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertInstitutionalReportingMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "institutional_reporting_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeInstitutionalReportingState(ctx);
      const nodeCode = `INST_REP_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalInstitutionalReportingNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalInstitutionalReportingNode.create({
        data: {
          relationshipId,
          executiveOrchestrationNodeId: ctx.activeExecutiveOrchestrationNodeId,
          monitoringNodeId: ctx.activeMonitoringNodeId,
          stabilizationNodeId: ctx.activeStabilizationNodeId,
          governanceNodeId: ctx.activeGovernanceNodeId,
          arbitrationCaseId: ctx.activeArbitrationCaseId,
          recoveryPlanId: ctx.activeRecoveryPlanId,
          sovereigntyNodeId: ctx.primarySovereigntyNodeId,
          continuityNodeId: ctx.primaryContinuityNodeId,
          macroEconomicNodeId: ctx.primaryMacroNodeId,
          supplyFlowNodeId: ctx.primarySupplyFlowNodeId,
          geoZoneId: ctx.geoZoneId,
          sectorNodeId: null,
          strategicMemoryId: null,
          nodeCode,
          reportingType: state.reportingType,
          reportingPriority: state.reportingPriority,
          reportingStatus: state.reportingStatus,
          severity: state.severity,
          institutionalScore: state.institutionalScore,
          executiveRisk: state.executiveRisk,
          strategicResilience: state.strategicResilience,
          systemicExposure: state.systemicExposure,
          strategicAlignmentScore: state.strategicAlignmentScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          orchestrationPressure: state.orchestrationPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            systemicRiskDetected: state.systemicRiskDetected,
            executivePressureDetected: state.executivePressureDetected,
            institutionalPriorityDetected: state.institutionalPriorityDetected,
            resilienceDetected: state.resilienceDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_institutional_reporting.syncInstitutionalReportingState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalInstitutionalReportingSignalType; intensity: number }> = [
        { type: RelationalInstitutionalReportingSignalType.INSTITUTIONAL, intensity: state.institutionalScore },
        { type: RelationalInstitutionalReportingSignalType.EXECUTIVE, intensity: state.executiveRisk },
        { type: RelationalInstitutionalReportingSignalType.SYSTEMIC, intensity: state.systemicExposure },
        { type: RelationalInstitutionalReportingSignalType.RESILIENCE, intensity: state.strategicResilience },
        { type: RelationalInstitutionalReportingSignalType.ALIGNMENT, intensity: state.strategicAlignmentScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalInstitutionalReportingSignal.create({
          data: {
            reportingNodeId: node.id,
            relationshipId,
            signalCode: `INST_REP_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.executiveRisk,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const briefDrafts = this.briefSvc.generateInstitutionalBriefs(ctx, state);
      for (const brief of briefDrafts) {
        await this.prisma.relationalInstitutionalReportingBrief.create({
          data: {
            reportingNodeId: node.id,
            relationshipId,
            briefCode: `${brief.briefCode}:${Date.now()}`,
            briefType: brief.briefType,
            severity: brief.severity,
            priority: brief.priority,
            title: brief.title,
            summary: brief.summary,
            institutionalPressure: brief.institutionalPressure,
            systemicExposure: brief.systemicExposure,
            diagnostics: { template: true } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalInstitutionalReportingSnapshot.create({
        data: {
          relationshipId,
          reportingNodeId: node.id,
          snapshotCode: `INST_REP_SNAP:${relationshipId}:${Date.now()}`,
          reportingStatus: state.reportingStatus,
          institutionalScore: state.institutionalScore,
          executiveRisk: state.executiveRisk,
          strategicResilience: state.strategicResilience,
          systemicExposure: state.systemicExposure,
          diagnostics: { briefCount: briefDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalInstitutionalReportingEvent.create({
        data: {
          relationshipId,
          reportingNodeId: node.id,
          eventType: RelationalInstitutionalReportingEventType.BRIEF_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { institutionalScore: state.institutionalScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        reportingNodeId: node.id,
        nodeCode,
        reportingDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.institutional_reporting.brief_generated",
          intensity: state.institutionalScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.systemicRiskDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.institutional_reporting.systemic_risk_detected",
            intensity: state.systemicExposure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.executivePressureDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.institutional_reporting.executive_pressure_detected",
            intensity: state.executiveRisk,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.institutionalPriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.institutional_reporting.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.institutional_reporting.resilience_detected",
            intensity: state.strategicResilience,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`institutional reporting ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.strategicIntelligenceIngestion.syncStrategicIntelligenceState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "strategic_intelligence_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }

  async archiveInstitutionalReportingSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalInstitutionalReportingSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertInstitutionalReportingMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalInstitutionalReportingSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalInstitutionalReportingEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        reportingNodeId: snap.reportingNodeId,
        eventType: RelationalInstitutionalReportingEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
