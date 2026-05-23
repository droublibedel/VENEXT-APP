import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalGlobalExecutiveSupervisionEventType,
  RelationalGlobalExecutiveSupervisionSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalGlobalExecutiveSupervisionCorridorContextService } from "./relational-global-executive-supervision-corridor-context.service";
import { RelationalGlobalExecutiveSupervisionEngineService } from "./relational-global-executive-supervision-engine.service";
import { RelationalGlobalExecutiveSupervisionMatrixService } from "./relational-global-executive-supervision-matrix.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";
import { RelationalGlobalExecutiveSupervisionRealtimeService } from "./relational-global-executive-supervision-realtime.service";
import { RelationalStrategicObservatoryIngestionService } from "../relational-strategic-observatory/relational-strategic-observatory-ingestion.service";

@Injectable()
export class RelationalGlobalExecutiveSupervisionIngestionService {
  private readonly log = new Logger(RelationalGlobalExecutiveSupervisionIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalGlobalExecutiveSupervisionPolicyService,
    private readonly corridorContext: RelationalGlobalExecutiveSupervisionCorridorContextService,
    private readonly engine: RelationalGlobalExecutiveSupervisionEngineService,
    private readonly matrixSvc: RelationalGlobalExecutiveSupervisionMatrixService,
    private readonly realtime: RelationalGlobalExecutiveSupervisionRealtimeService,
    @Inject(forwardRef(() => RelationalStrategicObservatoryIngestionService))
    private readonly strategicObservatoryIngestion: RelationalStrategicObservatoryIngestionService,
  ) {}

  private async commandEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_global_executive_supervision_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_global_executive_supervision_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.40 — chained after executive control room (20.39). */
  async syncGlobalExecutiveSupervisionState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "global_executive_supervision_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
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

      const mutationGate = this.policy.assertGlobalExecutiveSupervisionMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "global_executive_supervision_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeGlobalExecutiveSupervisionState(ctx);
      const nodeCode = `EXEC_SUPERV_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalGlobalExecutiveSupervisionNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalGlobalExecutiveSupervisionNode.create({
        data: {
          relationshipId,
          executiveStrategicSynthesisNodeId: ctx.activeExecutiveStrategicSynthesisNodeId,
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
          supervisionType: state.supervisionType,
          supervisionPriority: state.supervisionPriority,
          supervisionStatus: state.supervisionStatus,
          severity: state.severity,
          supervisionScore: state.supervisionScore,
          executivePressure: state.executivePressure,
          systemicExposure: state.systemicExposure,
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
          controlRoomPressure: state.controlRoomPressure,
          synthesisPressure: state.synthesisPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            executiveEscalationDetected: state.executiveEscalationDetected,
            systemicConcentrationDetected: state.systemicConcentrationDetected,
            supervisionPriorityDetected: state.supervisionPriorityDetected,
            resilienceDetected: state.resilienceDetected,
            globalCollapseRiskDetected: state.globalCollapseRiskDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_global_executive_supervision.syncGlobalExecutiveSupervisionState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalGlobalExecutiveSupervisionSignalType; intensity: number }> = [
        { type: RelationalGlobalExecutiveSupervisionSignalType.SUPERVISION, intensity: state.supervisionScore },
        { type: RelationalGlobalExecutiveSupervisionSignalType.EXECUTIVE, intensity: state.executivePressure },
        { type: RelationalGlobalExecutiveSupervisionSignalType.SYSTEMIC, intensity: state.systemicExposure },
        { type: RelationalGlobalExecutiveSupervisionSignalType.RESILIENCE, intensity: state.resilienceStrength },
        { type: RelationalGlobalExecutiveSupervisionSignalType.BALANCE, intensity: state.strategicAlignmentScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalGlobalExecutiveSupervisionSignal.create({
          data: {
            globalExecutiveSupervisionNodeId: node.id,
            relationshipId,
            signalCode: `EXEC_SUPERV_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.systemicExposure,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const matrixDrafts = this.matrixSvc.generateGlobalExecutiveSupervisionMatrices(ctx, state);
      for (const matrix of matrixDrafts) {
        await this.prisma.relationalGlobalExecutiveSupervisionMatrix.create({
          data: {
            globalExecutiveSupervisionNodeId: node.id,
            relationshipId,
            matrixCode: `${matrix.matrixCode}:${Date.now()}`,
            matrixType: matrix.matrixType,
            severity: matrix.severity,
            priority: matrix.priority,
            title: matrix.title,
            summary: matrix.summary,
            institutionalPressure: matrix.institutionalPressure,
            executivePressure: matrix.executivePressure,
            diagnostics: { template: true } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalGlobalExecutiveSupervisionSnapshot.create({
        data: {
          relationshipId,
          globalExecutiveSupervisionNodeId: node.id,
          snapshotCode: `EXEC_SUPERV_SNAP:${relationshipId}:${Date.now()}`,
          supervisionStatus: state.supervisionStatus,
          supervisionScore: state.supervisionScore,
          executivePressure: state.executivePressure,
          systemicExposure: state.systemicExposure,
          resilienceStrength: state.resilienceStrength,
          diagnostics: { matrixCount: matrixDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalGlobalExecutiveSupervisionEvent.create({
        data: {
          relationshipId,
          globalExecutiveSupervisionNodeId: node.id,
          eventType: RelationalGlobalExecutiveSupervisionEventType.MATRIX_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { supervisionScore: state.supervisionScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        globalExecutiveSupervisionNodeId: node.id,
        nodeCode,
        supervisionDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.global_executive_supervision.matrix_generated",
          intensity: state.supervisionScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.executiveEscalationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.global_executive_supervision.executive_pressure_detected",
            intensity: state.executivePressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicConcentrationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.global_executive_supervision.systemic_exposure_detected",
            intensity: state.systemicExposure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.supervisionPriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.global_executive_supervision.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.global_executive_supervision.resilience_detected",
            intensity: state.resilienceStrength,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`global executive supervision ingestion failed: ${String(err)}`);
    } finally {
      try {
        await this.strategicObservatoryIngestion.syncStrategicObservatoryState(relationshipId);
      } catch (chainErr) {
        this.log.error(
          JSON.stringify({
            phase: "strategic_observatory_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
      this.ingestActive.delete(relationshipId);
    }
  }

  async archiveGlobalExecutiveSupervisionSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalGlobalExecutiveSupervisionSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertGlobalExecutiveSupervisionMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalGlobalExecutiveSupervisionSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalGlobalExecutiveSupervisionEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        globalExecutiveSupervisionNodeId: snap.globalExecutiveSupervisionNodeId,
        eventType: RelationalGlobalExecutiveSupervisionEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
