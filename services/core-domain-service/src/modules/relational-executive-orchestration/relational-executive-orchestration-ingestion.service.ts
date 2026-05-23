import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalExecutiveOrchestrationEventType,
  RelationalExecutiveOrchestrationSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalExecutiveOrchestrationCorridorContextService } from "./relational-executive-orchestration-corridor-context.service";
import { RelationalExecutiveOrchestrationDependencyService } from "./relational-executive-orchestration-dependency.service";
import { RelationalExecutiveOrchestrationEngineService } from "./relational-executive-orchestration-engine.service";
import { RelationalExecutiveOrchestrationPolicyService } from "./relational-executive-orchestration-policy.service";
import { RelationalInstitutionalReportingIngestionService } from "../relational-institutional-reporting/relational-institutional-reporting-ingestion.service";
import { RelationalExecutiveOrchestrationRealtimeService } from "./relational-executive-orchestration-realtime.service";

@Injectable()
export class RelationalExecutiveOrchestrationIngestionService {
  private readonly log = new Logger(RelationalExecutiveOrchestrationIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalExecutiveOrchestrationPolicyService,
    private readonly corridorContext: RelationalExecutiveOrchestrationCorridorContextService,
    private readonly engine: RelationalExecutiveOrchestrationEngineService,
    private readonly dependencySvc: RelationalExecutiveOrchestrationDependencyService,
    private readonly realtime: RelationalExecutiveOrchestrationRealtimeService,
    @Inject(forwardRef(() => RelationalInstitutionalReportingIngestionService))
    private readonly institutionalReportingIngestion: RelationalInstitutionalReportingIngestionService,
  ) {}

  private async orchestrationEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_executive_orchestration_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_executive_orchestration_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.34 — chained after economic monitoring (20.33). */
  async syncExecutiveOrchestrationState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "executive_orchestration_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.orchestrationEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true, requesterOrganizationId: true, receiverOrganizationId: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertExecutiveOrchestrationMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "executive_orchestration_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeExecutiveOrchestrationState(ctx);
      const nodeCode = `EXEC_ORCH_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalExecutiveOrchestrationNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalExecutiveOrchestrationNode.create({
        data: {
          relationshipId,
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
          orchestrationType: state.orchestrationType,
          orchestrationPriority: state.orchestrationPriority,
          orchestrationStatus: state.orchestrationStatus,
          severity: state.severity,
          orchestrationScore: state.orchestrationScore,
          executiveCoordinationPressure: state.executiveCoordinationPressure,
          systemicExposure: state.systemicExposure,
          executiveResilience: state.executiveResilience,
          strategicAlignmentScore: state.strategicAlignmentScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          dependencyPressure: state.dependencyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            executiveInstabilityDetected: state.executiveInstabilityDetected,
            coordinationBreakdownDetected: state.coordinationBreakdownDetected,
            systemicConcentrationDetected: state.systemicConcentrationDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_executive_orchestration.syncExecutiveOrchestrationState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalExecutiveOrchestrationSignalType; intensity: number }> = [
        { type: RelationalExecutiveOrchestrationSignalType.EXECUTIVE, intensity: state.executiveCoordinationPressure },
        { type: RelationalExecutiveOrchestrationSignalType.SYSTEMIC, intensity: state.systemicExposure },
        { type: RelationalExecutiveOrchestrationSignalType.COORDINATION, intensity: state.governancePressure },
        { type: RelationalExecutiveOrchestrationSignalType.RESILIENCE, intensity: state.executiveResilience },
        { type: RelationalExecutiveOrchestrationSignalType.ALIGNMENT, intensity: state.strategicAlignmentScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalExecutiveOrchestrationSignal.create({
          data: {
            orchestrationNodeId: node.id,
            relationshipId,
            signalCode: `EXEC_ORCH_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.executiveCoordinationPressure,
            riskLevel: state.systemicExposure,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const depDrafts = this.dependencySvc.computeExecutiveDependencies(ctx);
      for (const dep of depDrafts) {
        await this.prisma.relationalExecutiveOrchestrationDependency.create({
          data: {
            sourceNodeId: node.id,
            targetNodeId: node.id,
            relationshipId,
            dependencyCode: `${dep.dependencyCode}:${Date.now()}`,
            dependencyWeight: dep.dependencyWeight,
            crossCorridorExposure: dep.crossCorridorExposure,
            coordinationStress: dep.coordinationStress,
            concentrationScore: dep.concentrationScore,
            diagnostics: { targetRef: dep.targetRef } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalExecutiveOrchestrationSnapshot.create({
        data: {
          relationshipId,
          orchestrationNodeId: node.id,
          snapshotCode: `EXEC_ORCH_SNAP:${relationshipId}:${Date.now()}`,
          orchestrationStatus: state.orchestrationStatus,
          orchestrationScore: state.orchestrationScore,
          executiveCoordinationPressure: state.executiveCoordinationPressure,
          systemicExposure: state.systemicExposure,
          executiveResilience: state.executiveResilience,
          diagnostics: { dependencyCount: depDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalExecutiveOrchestrationEvent.create({
        data: {
          relationshipId,
          orchestrationNodeId: node.id,
          eventType: RelationalExecutiveOrchestrationEventType.INSTABILITY_DETECTED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { orchestrationScore: state.orchestrationScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        orchestrationNodeId: node.id,
        nodeCode,
        orchestrationDepth: 1,
      };

      if (state.executiveInstabilityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_orchestration.instability_detected",
            intensity: state.executiveCoordinationPressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicConcentrationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_orchestration.systemic_exposure_detected",
            intensity: state.systemicExposure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.executiveUrgency >= 55) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_orchestration.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.coordinationBreakdownDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_orchestration.coordination_breakdown_detected",
            intensity: state.executiveCoordinationPressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.executiveResilience >= 60) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_orchestration.resilience_detected",
            intensity: state.executiveResilience,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`executive orchestration ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.institutionalReportingIngestion.syncInstitutionalReportingState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "institutional_reporting_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }

  async archiveExecutiveOrchestrationSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalExecutiveOrchestrationSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertExecutiveOrchestrationMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalExecutiveOrchestrationSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalExecutiveOrchestrationEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        orchestrationNodeId: snap.orchestrationNodeId,
        eventType: RelationalExecutiveOrchestrationEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
