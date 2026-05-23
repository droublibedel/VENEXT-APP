import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalStrategicIntelligenceEventType,
  RelationalStrategicIntelligenceSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalStrategicIntelligenceSynthesisService } from "./relational-strategic-intelligence-synthesis.service";
import { RelationalStrategicIntelligenceCorridorContextService } from "./relational-strategic-intelligence-corridor-context.service";
import { RelationalStrategicIntelligenceEngineService } from "./relational-strategic-intelligence-engine.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";
import { RelationalStrategicIntelligenceRealtimeService } from "./relational-strategic-intelligence-realtime.service";
import { RelationalStrategicCommandIngestionService } from "../relational-strategic-command/relational-strategic-command-ingestion.service";

@Injectable()
export class RelationalStrategicIntelligenceIngestionService {
  private readonly log = new Logger(RelationalStrategicIntelligenceIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalStrategicIntelligencePolicyService,
    private readonly corridorContext: RelationalStrategicIntelligenceCorridorContextService,
    private readonly engine: RelationalStrategicIntelligenceEngineService,
    private readonly synthesisSvc: RelationalStrategicIntelligenceSynthesisService,
    private readonly realtime: RelationalStrategicIntelligenceRealtimeService,
    @Inject(forwardRef(() => RelationalStrategicCommandIngestionService))
    private readonly strategicCommandIngestion: RelationalStrategicCommandIngestionService,
  ) {}

  private async reportingEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_strategic_intelligence_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_strategic_intelligence_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.36 — chained after institutional reporting (20.35). */
  async syncStrategicIntelligenceState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "strategic_intelligence_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
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

      const mutationGate = this.policy.assertStrategicIntelligenceMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "strategic_intelligence_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeStrategicIntelligenceState(ctx);
      const nodeCode = `STRAT_INTEL_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalStrategicIntelligenceNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalStrategicIntelligenceNode.create({
        data: {
          relationshipId,
          institutionalReportingNodeId: ctx.activeInstitutionalReportingNodeId,
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
          intelligenceType: state.intelligenceType,
          intelligencePriority: state.intelligencePriority,
          intelligenceStatus: state.intelligenceStatus,
          severity: state.severity,
          strategicIntelligenceScore: state.strategicIntelligenceScore,
          executiveExposure: state.executiveExposure,
          resilienceStrength: state.resilienceStrength,
          systemicConcentration: state.systemicConcentration,
          strategicAlignmentScore: state.strategicAlignmentScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          orchestrationPressure: state.orchestrationPressure,
          institutionalPressure: state.institutionalPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            systemicPressureDetected: state.systemicPressureDetected,
            executiveExposureDetected: state.executiveExposureDetected,
            strategicPriorityDetected: state.strategicPriorityDetected,
            resilienceDetected: state.resilienceDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_strategic_intelligence.syncStrategicIntelligenceState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalStrategicIntelligenceSignalType; intensity: number }> = [
        { type: RelationalStrategicIntelligenceSignalType.STRATEGIC, intensity: state.strategicIntelligenceScore },
        { type: RelationalStrategicIntelligenceSignalType.EXECUTIVE, intensity: state.executiveExposure },
        { type: RelationalStrategicIntelligenceSignalType.SYSTEMIC, intensity: state.systemicConcentration },
        { type: RelationalStrategicIntelligenceSignalType.RESILIENCE, intensity: state.resilienceStrength },
        { type: RelationalStrategicIntelligenceSignalType.ALIGNMENT, intensity: state.strategicAlignmentScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalStrategicIntelligenceSignal.create({
          data: {
            intelligenceNodeId: node.id,
            relationshipId,
            signalCode: `STRAT_INTEL_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.executiveExposure,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const synthesisDrafts = this.synthesisSvc.generateStrategicSyntheses(ctx, state);
      for (const brief of synthesisDrafts) {
        await this.prisma.relationalStrategicIntelligenceSynthesis.create({
          data: {
            intelligenceNodeId: node.id,
            relationshipId,
            synthesisCode: `${brief.synthesisCode}:${Date.now()}`,
            synthesisType: brief.synthesisType,
            severity: brief.severity,
            priority: brief.priority,
            title: brief.title,
            summary: brief.summary,
            institutionalPressure: brief.institutionalPressure,
            systemicConcentration: brief.systemicConcentration,
            diagnostics: { template: true } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalStrategicIntelligenceSnapshot.create({
        data: {
          relationshipId,
          intelligenceNodeId: node.id,
          snapshotCode: `STRAT_INTEL_SNAP:${relationshipId}:${Date.now()}`,
          intelligenceStatus: state.intelligenceStatus,
          strategicIntelligenceScore: state.strategicIntelligenceScore,
          executiveExposure: state.executiveExposure,
          resilienceStrength: state.resilienceStrength,
          systemicConcentration: state.systemicConcentration,
          diagnostics: { synthesisCount: synthesisDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalStrategicIntelligenceEvent.create({
        data: {
          relationshipId,
          intelligenceNodeId: node.id,
          eventType: RelationalStrategicIntelligenceEventType.SYNTHESIS_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { strategicIntelligenceScore: state.strategicIntelligenceScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        intelligenceNodeId: node.id,
        nodeCode,
        intelligenceDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.strategic_intelligence.synthesis_generated",
          intensity: state.strategicIntelligenceScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.systemicPressureDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_intelligence.systemic_pressure_detected",
            intensity: state.systemicConcentration,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.executiveExposureDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_intelligence.executive_exposure_detected",
            intensity: state.executiveExposure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.strategicPriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_intelligence.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_intelligence.resilience_detected",
            intensity: state.resilienceStrength,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`strategic intelligence ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.strategicCommandIngestion.syncStrategicCommandState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "strategic_command_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }

  async archiveStrategicIntelligenceSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalStrategicIntelligenceSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertStrategicIntelligenceMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalStrategicIntelligenceSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalStrategicIntelligenceEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        intelligenceNodeId: snap.intelligenceNodeId,
        eventType: RelationalStrategicIntelligenceEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
