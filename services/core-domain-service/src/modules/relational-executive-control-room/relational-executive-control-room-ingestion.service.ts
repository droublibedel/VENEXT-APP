import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalExecutiveControlRoomEventType,
  RelationalExecutiveControlRoomSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalExecutiveControlRoomCorridorContextService } from "./relational-executive-control-room-corridor-context.service";
import { RelationalExecutiveControlRoomEngineService } from "./relational-executive-control-room-engine.service";
import { RelationalExecutiveControlRoomBoardService } from "./relational-executive-control-room-board.service";
import { RelationalExecutiveControlRoomPolicyService } from "./relational-executive-control-room-policy.service";
import { RelationalExecutiveControlRoomRealtimeService } from "./relational-executive-control-room-realtime.service";
import { RelationalExecutiveStrategicSynthesisIngestionService } from "../relational-executive-strategic-synthesis/relational-executive-strategic-synthesis-ingestion.service";

@Injectable()
export class RelationalExecutiveControlRoomIngestionService {
  private readonly log = new Logger(RelationalExecutiveControlRoomIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalExecutiveControlRoomPolicyService,
    private readonly corridorContext: RelationalExecutiveControlRoomCorridorContextService,
    private readonly engine: RelationalExecutiveControlRoomEngineService,
    private readonly boardSvc: RelationalExecutiveControlRoomBoardService,
    private readonly realtime: RelationalExecutiveControlRoomRealtimeService,
    @Inject(forwardRef(() => RelationalExecutiveStrategicSynthesisIngestionService))
    private readonly executiveStrategicSynthesisIngestion: RelationalExecutiveStrategicSynthesisIngestionService,
  ) {}

  private async commandEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_executive_control_room_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_executive_control_room_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.39 — chained after executive operations (20.38). */
  async syncExecutiveControlRoomState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "executive_control_room_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
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

      const mutationGate = this.policy.assertExecutiveControlRoomMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "executive_control_room_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeExecutiveControlRoomState(ctx);
      const nodeCode = `EXEC_CTRL_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalExecutiveControlRoomNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalExecutiveControlRoomNode.create({
        data: {
          relationshipId,
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
          controlRoomType: state.controlRoomType,
          boardPriority: state.boardPriority,
          controlRoomStatus: state.controlRoomStatus,
          severity: state.severity,
          controlRoomScore: state.controlRoomScore,
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
          operationsPressure: state.operationsPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            executiveEscalationDetected: state.executiveEscalationDetected,
            strategicCoordinationFailureDetected: state.strategicCoordinationFailureDetected,
            strategicPriorityDetected: state.strategicPriorityDetected,
            resilienceDetected: state.resilienceDetected,
            systemicCollapseRiskDetected: state.systemicCollapseRiskDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_executive_control_room.syncExecutiveControlRoomState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalExecutiveControlRoomSignalType; intensity: number }> = [
        { type: RelationalExecutiveControlRoomSignalType.CONTROL, intensity: state.controlRoomScore },
        { type: RelationalExecutiveControlRoomSignalType.EXECUTIVE, intensity: state.executivePressure },
        { type: RelationalExecutiveControlRoomSignalType.SYSTEMIC, intensity: state.systemicConcentration },
        { type: RelationalExecutiveControlRoomSignalType.RESILIENCE, intensity: state.resilienceStrength },
        { type: RelationalExecutiveControlRoomSignalType.BALANCE, intensity: state.strategicBalanceScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalExecutiveControlRoomSignal.create({
          data: {
            controlRoomNodeId: node.id,
            relationshipId,
            signalCode: `EXEC_CTRL_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.systemicConcentration,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const boardDrafts = this.boardSvc.generateExecutiveControlRoomBoards(ctx, state);
      for (const board of boardDrafts) {
        await this.prisma.relationalExecutiveControlRoomBoard.create({
          data: {
            controlRoomNodeId: node.id,
            relationshipId,
            boardCode: `${board.boardCode}:${Date.now()}`,
            boardType: board.boardType,
            severity: board.severity,
            priority: board.priority,
            title: board.title,
            summary: board.summary,
            institutionalPressure: board.institutionalPressure,
            executivePressure: board.executivePressure,
            diagnostics: { template: true } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalExecutiveControlRoomSnapshot.create({
        data: {
          relationshipId,
          controlRoomNodeId: node.id,
          snapshotCode: `EXEC_CTRL_SNAP:${relationshipId}:${Date.now()}`,
          controlRoomStatus: state.controlRoomStatus,
          controlRoomScore: state.controlRoomScore,
          executivePressure: state.executivePressure,
          systemicConcentration: state.systemicConcentration,
          resilienceStrength: state.resilienceStrength,
          diagnostics: { boardCount: boardDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalExecutiveControlRoomEvent.create({
        data: {
          relationshipId,
          controlRoomNodeId: node.id,
          eventType: RelationalExecutiveControlRoomEventType.BOARD_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { controlRoomScore: state.controlRoomScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        controlRoomNodeId: node.id,
        nodeCode,
        controlRoomDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.executive_control_room.board_generated",
          intensity: state.controlRoomScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.executiveEscalationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_control_room.executive_pressure_detected",
            intensity: state.executivePressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.strategicCoordinationFailureDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_control_room.systemic_concentration_detected",
            intensity: state.systemicConcentration,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.strategicPriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_control_room.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.executive_control_room.resilience_detected",
            intensity: state.resilienceStrength,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`executive control room ingestion failed: ${String(err)}`);
    } finally {
      try {
        await this.executiveStrategicSynthesisIngestion.syncExecutiveStrategicSynthesisState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "executive_strategic_synthesis_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
      this.ingestActive.delete(relationshipId);
    }
  }

  async archiveExecutiveControlRoomSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalExecutiveControlRoomSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertExecutiveControlRoomMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalExecutiveControlRoomSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalExecutiveControlRoomEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        controlRoomNodeId: snap.controlRoomNodeId,
        eventType: RelationalExecutiveControlRoomEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
