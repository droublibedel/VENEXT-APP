import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalExecutiveOperationsEventType,
  RelationalExecutiveOperationsSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalExecutiveOperationsCorridorContextService } from "./relational-executive-operations-corridor-context.service";
import { RelationalExecutiveOperationsEngineService } from "./relational-executive-operations-engine.service";
import { RelationalExecutiveOperationsMatrixService } from "./relational-executive-operations-matrix.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";
import { RelationalExecutiveOperationsRealtimeService } from "./relational-executive-operations-realtime.service";
import { RelationalExecutiveControlRoomIngestionService } from "../relational-executive-control-room/relational-executive-control-room-ingestion.service";

@Injectable()
export class RelationalExecutiveOperationsIngestionService {
  private readonly log = new Logger(RelationalExecutiveOperationsIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalExecutiveOperationsPolicyService,
    private readonly corridorContext: RelationalExecutiveOperationsCorridorContextService,
    private readonly engine: RelationalExecutiveOperationsEngineService,
    private readonly matrixSvc: RelationalExecutiveOperationsMatrixService,
    private readonly realtime: RelationalExecutiveOperationsRealtimeService,
    @Inject(forwardRef(() => RelationalExecutiveControlRoomIngestionService))
    private readonly executiveControlRoomIngestion: RelationalExecutiveControlRoomIngestionService,
  ) {}

  private async commandEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_executive_operations_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_executive_operations_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.38 — chained after strategic command (20.37). */
  async syncExecutiveOperationsState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "executive_operations_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
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

      const mutationGate = this.policy.assertExecutiveOperationsMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "executive_operations_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeExecutiveOperationsState(ctx);
      const nodeCode = `EXEC_OPS_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalExecutiveOperationsNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalExecutiveOperationsNode.create({
        data: {
          relationshipId,
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
          operationsType: state.operationsType,
          operationsPriority: state.operationsPriority,
          operationsStatus: state.operationsStatus,
          severity: state.severity,
          executiveOperationsScore: state.executiveOperationsScore,
          executivePressure: state.executivePressure,
          systemicConcentration: state.systemicConcentration,
          resilienceStrength: state.resilienceStrength,
          strategicBalanceScore: state.strategicBalanceScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          orchestrationPressure: state.orchestrationPressure,
          institutionalPressure: state.institutionalPressure,
          intelligencePressure: state.intelligencePressure,
          commandPressure: state.commandPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            executiveEscalationDetected: state.executiveEscalationDetected,
            coordinationCollapseDetected: state.coordinationCollapseDetected,
            strategicPriorityDetected: state.strategicPriorityDetected,
            resilienceDetected: state.resilienceDetected,
            operationalInstabilityDetected: state.operationalInstabilityDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_executive_operations.syncExecutiveOperationsState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalExecutiveOperationsSignalType; intensity: number }> = [
        { type: RelationalExecutiveOperationsSignalType.OPERATIONS, intensity: state.executiveOperationsScore },
        { type: RelationalExecutiveOperationsSignalType.EXECUTIVE, intensity: state.executivePressure },
        { type: RelationalExecutiveOperationsSignalType.SYSTEMIC, intensity: state.systemicConcentration },
        { type: RelationalExecutiveOperationsSignalType.RESILIENCE, intensity: state.resilienceStrength },
        { type: RelationalExecutiveOperationsSignalType.BALANCE, intensity: state.strategicBalanceScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalExecutiveOperationsSignal.create({
          data: {
            operationsNodeId: node.id,
            relationshipId,
            signalCode: `EXEC_OPS_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.systemicConcentration,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const matrixDrafts = this.matrixSvc.generateExecutiveOperationsMatrices(ctx, state);
      for (const matrix of matrixDrafts) {
        await this.prisma.relationalExecutiveOperationsMatrix.create({
          data: {
            operationsNodeId: node.id,
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

      await this.prisma.relationalExecutiveOperationsSnapshot.create({
        data: {
          relationshipId,
          operationsNodeId: node.id,
          snapshotCode: `EXEC_OPS_SNAP:${relationshipId}:${Date.now()}`,
          operationsStatus: state.operationsStatus,
          executiveOperationsScore: state.executiveOperationsScore,
          executivePressure: state.executivePressure,
          systemicConcentration: state.systemicConcentration,
          resilienceStrength: state.resilienceStrength,
          diagnostics: { matrixCount: matrixDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalExecutiveOperationsEvent.create({
        data: {
          relationshipId,
          operationsNodeId: node.id,
          eventType: RelationalExecutiveOperationsEventType.MATRIX_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { executiveOperationsScore: state.executiveOperationsScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        operationsNodeId: node.id,
        nodeCode,
        operationsDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.executive_operations.matrix_generated",
          intensity: state.executiveOperationsScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.executiveEscalationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_operations.executive_pressure_detected",
            intensity: state.executivePressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.coordinationCollapseDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_operations.systemic_concentration_detected",
            intensity: state.systemicConcentration,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.strategicPriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_operations.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_operations.resilience_detected",
            intensity: state.resilienceStrength,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`executive operations ingestion failed: ${String(err)}`);
    } finally {
      try {
        await this.executiveControlRoomIngestion.syncExecutiveControlRoomState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "executive_control_room_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
      this.ingestActive.delete(relationshipId);
    }
  }

  async archiveExecutiveOperationsSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalExecutiveOperationsSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertExecutiveOperationsMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalExecutiveOperationsSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalExecutiveOperationsEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        operationsNodeId: snap.operationsNodeId,
        eventType: RelationalExecutiveOperationsEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
