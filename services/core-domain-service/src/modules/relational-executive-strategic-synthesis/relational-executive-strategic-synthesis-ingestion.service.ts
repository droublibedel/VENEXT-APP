import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalExecutiveStrategicSynthesisEventType,
  RelationalExecutiveStrategicSynthesisSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalExecutiveStrategicSynthesisCorridorContextService } from "./relational-executive-strategic-synthesis-corridor-context.service";
import { RelationalExecutiveStrategicSynthesisEngineService } from "./relational-executive-strategic-synthesis-engine.service";
import { RelationalExecutiveStrategicSynthesisDigestService } from "./relational-executive-strategic-synthesis-digest.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";
import { RelationalExecutiveStrategicSynthesisRealtimeService } from "./relational-executive-strategic-synthesis-realtime.service";
import { RelationalGlobalExecutiveSupervisionIngestionService } from "../relational-global-executive-supervision/relational-global-executive-supervision-ingestion.service";

@Injectable()
export class RelationalExecutiveStrategicSynthesisIngestionService {
  private readonly log = new Logger(RelationalExecutiveStrategicSynthesisIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalExecutiveStrategicSynthesisPolicyService,
    private readonly corridorContext: RelationalExecutiveStrategicSynthesisCorridorContextService,
    private readonly engine: RelationalExecutiveStrategicSynthesisEngineService,
    private readonly digestSvc: RelationalExecutiveStrategicSynthesisDigestService,
    private readonly realtime: RelationalExecutiveStrategicSynthesisRealtimeService,
    @Inject(forwardRef(() => RelationalGlobalExecutiveSupervisionIngestionService))
    private readonly globalExecutiveSupervisionIngestion: RelationalGlobalExecutiveSupervisionIngestionService,
  ) {}

  private async commandEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_executive_strategic_synthesis_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_executive_strategic_synthesis_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.40 — chained after executive control room (20.39). */
  async syncExecutiveStrategicSynthesisState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "executive_strategic_synthesis_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.commandEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true, requesterOrganizationId: true, receiverOrganizationId: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertExecutiveStrategicSynthesisMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "executive_strategic_synthesis_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeExecutiveStrategicSynthesisState(ctx);
      const nodeCode = `EXEC_SYNTH_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalExecutiveStrategicSynthesisNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalExecutiveStrategicSynthesisNode.create({
        data: {
          relationshipId,
          executiveControlRoomNodeId: ctx.activeExecutiveControlRoomNodeId,
          executiveOperationsNodeId: ctx.activeExecutiveOperationsNodeId,
          strategicCommandNodeId: ctx.activeStrategicCommandNodeId,
          strategicIntelligenceNodeId: ctx.activeStrategicIntelligenceNodeId,
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
          synthesisType: state.synthesisType,
          synthesisPriority: state.synthesisPriority,
          synthesisStatus: state.synthesisStatus,
          severity: state.severity,
          synthesisScore: state.synthesisScore,
          executiveExposure: state.executiveExposure,
          systemicPressure: state.systemicPressure,
          resilienceStrength: state.resilienceStrength,
          strategicAlignmentScore: state.strategicAlignmentScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          orchestrationPressure: state.orchestrationPressure,
          institutionalPressure: state.institutionalPressure,
          intelligencePressure: state.intelligencePressure,
          commandPressure: state.commandPressure,
          operationsPressure: state.operationsPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            executiveInstabilityDetected: state.executiveInstabilityDetected,
            systemicEscalationDetected: state.systemicEscalationDetected,
            strategicPriorityDetected: state.strategicPriorityDetected,
            resilienceDetected: state.resilienceDetected,
            strategicCollapseRiskDetected: state.strategicCollapseRiskDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_executive_strategic_synthesis.syncExecutiveStrategicSynthesisState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalExecutiveStrategicSynthesisSignalType; intensity: number }> = [
        { type: RelationalExecutiveStrategicSynthesisSignalType.SYNTHESIS, intensity: state.synthesisScore },
        { type: RelationalExecutiveStrategicSynthesisSignalType.EXECUTIVE, intensity: state.executiveExposure },
        { type: RelationalExecutiveStrategicSynthesisSignalType.SYSTEMIC, intensity: state.systemicPressure },
        { type: RelationalExecutiveStrategicSynthesisSignalType.RESILIENCE, intensity: state.resilienceStrength },
        { type: RelationalExecutiveStrategicSynthesisSignalType.BALANCE, intensity: state.strategicAlignmentScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalExecutiveStrategicSynthesisSignal.create({
          data: {
            strategicSynthesisNodeId: node.id,
            relationshipId,
            signalCode: `EXEC_SYNTH_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.systemicPressure,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const digestDrafts = this.digestSvc.generateExecutiveStrategicSynthesisDigests(ctx, state);
      for (const digest of digestDrafts) {
        await this.prisma.relationalExecutiveStrategicSynthesisDigest.create({
          data: {
            strategicSynthesisNodeId: node.id,
            relationshipId,
            digestCode: `${digest.digestCode}:${Date.now()}`,
            digestType: digest.digestType,
            severity: digest.severity,
            priority: digest.priority,
            title: digest.title,
            summary: digest.summary,
            institutionalPressure: digest.institutionalPressure,
            executiveExposure: digest.executiveExposure,
            diagnostics: { template: true } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalExecutiveStrategicSynthesisSnapshot.create({
        data: {
          relationshipId,
          strategicSynthesisNodeId: node.id,
          snapshotCode: `EXEC_SYNTH_SNAP:${relationshipId}:${Date.now()}`,
          synthesisStatus: state.synthesisStatus,
          synthesisScore: state.synthesisScore,
          executiveExposure: state.executiveExposure,
          systemicPressure: state.systemicPressure,
          resilienceStrength: state.resilienceStrength,
          diagnostics: { digestCount: digestDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalExecutiveStrategicSynthesisEvent.create({
        data: {
          relationshipId,
          strategicSynthesisNodeId: node.id,
          eventType: RelationalExecutiveStrategicSynthesisEventType.DIGEST_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { synthesisScore: state.synthesisScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        strategicSynthesisNodeId: node.id,
        nodeCode,
        synthesisDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.executive_strategic_synthesis.digest_generated",
          intensity: state.synthesisScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.executiveInstabilityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_strategic_synthesis.executive_exposure_detected",
            intensity: state.executiveExposure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicEscalationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_strategic_synthesis.systemic_pressure_detected",
            intensity: state.systemicPressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.strategicPriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_strategic_synthesis.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_strategic_synthesis.resilience_detected",
            intensity: state.resilienceStrength,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`executive strategic synthesis ingestion failed: ${String(err)}`);
    } finally {
      try {
        await this.globalExecutiveSupervisionIngestion.syncGlobalExecutiveSupervisionState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "global_executive_supervision_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
      this.ingestActive.delete(relationshipId);
    }
  }

  async archiveExecutiveStrategicSynthesisSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalExecutiveStrategicSynthesisSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertExecutiveStrategicSynthesisMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalExecutiveStrategicSynthesisSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalExecutiveStrategicSynthesisEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        strategicSynthesisNodeId: snap.strategicSynthesisNodeId,
        eventType: RelationalExecutiveStrategicSynthesisEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
