import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalStrategicCommandEventType,
  RelationalStrategicCommandSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalStrategicCommandCorridorContextService } from "./relational-strategic-command-corridor-context.service";
import { RelationalStrategicCommandEngineService } from "./relational-strategic-command-engine.service";
import { RelationalStrategicCommandGridService } from "./relational-strategic-command-grid.service";
import { RelationalStrategicCommandPolicyService } from "./relational-strategic-command-policy.service";
import { RelationalStrategicCommandRealtimeService } from "./relational-strategic-command-realtime.service";
import { RelationalExecutiveOperationsIngestionService } from "../relational-executive-operations/relational-executive-operations-ingestion.service";

@Injectable()
export class RelationalStrategicCommandIngestionService {
  private readonly log = new Logger(RelationalStrategicCommandIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalStrategicCommandPolicyService,
    private readonly corridorContext: RelationalStrategicCommandCorridorContextService,
    private readonly engine: RelationalStrategicCommandEngineService,
    private readonly gridSvc: RelationalStrategicCommandGridService,
    private readonly realtime: RelationalStrategicCommandRealtimeService,
    @Inject(forwardRef(() => RelationalExecutiveOperationsIngestionService))
    private readonly executiveOperationsIngestion: RelationalExecutiveOperationsIngestionService,
  ) {}

  private async commandEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_strategic_command_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_strategic_command_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.37 — chained after strategic intelligence (20.36). */
  async syncStrategicCommandState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "strategic_command_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
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

      const mutationGate = this.policy.assertStrategicCommandMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "strategic_command_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeStrategicCommandState(ctx);
      const nodeCode = `STRAT_CMD_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalStrategicCommandNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalStrategicCommandNode.create({
        data: {
          relationshipId,
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
          commandType: state.commandType,
          commandPriority: state.commandPriority,
          commandStatus: state.commandStatus,
          severity: state.severity,
          commandScore: state.commandScore,
          systemicPressure: state.systemicPressure,
          executiveConcentration: state.executiveConcentration,
          resilienceStrength: state.resilienceStrength,
          strategicBalanceScore: state.strategicBalanceScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          orchestrationPressure: state.orchestrationPressure,
          institutionalPressure: state.institutionalPressure,
          intelligencePressure: state.intelligencePressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            systemicEscalationDetected: state.systemicEscalationDetected,
            executiveOverloadDetected: state.executiveOverloadDetected,
            strategicPriorityDetected: state.strategicPriorityDetected,
            resilienceDetected: state.resilienceDetected,
            strategicCollapseRiskDetected: state.strategicCollapseRiskDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_strategic_command.syncStrategicCommandState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalStrategicCommandSignalType; intensity: number }> = [
        { type: RelationalStrategicCommandSignalType.COMMAND, intensity: state.commandScore },
        { type: RelationalStrategicCommandSignalType.EXECUTIVE, intensity: state.executiveConcentration },
        { type: RelationalStrategicCommandSignalType.SYSTEMIC, intensity: state.systemicPressure },
        { type: RelationalStrategicCommandSignalType.RESILIENCE, intensity: state.resilienceStrength },
        { type: RelationalStrategicCommandSignalType.BALANCE, intensity: state.strategicBalanceScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalStrategicCommandSignal.create({
          data: {
            commandNodeId: node.id,
            relationshipId,
            signalCode: `STRAT_CMD_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.executiveConcentration,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const gridDrafts = this.gridSvc.generateStrategicCommandGrids(ctx, state);
      for (const grid of gridDrafts) {
        await this.prisma.relationalStrategicCommandGrid.create({
          data: {
            commandNodeId: node.id,
            relationshipId,
            gridCode: `${grid.gridCode}:${Date.now()}`,
            gridType: grid.gridType,
            severity: grid.severity,
            priority: grid.priority,
            title: grid.title,
            summary: grid.summary,
            institutionalPressure: grid.institutionalPressure,
            systemicPressure: grid.systemicPressure,
            diagnostics: { template: true } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalStrategicCommandSnapshot.create({
        data: {
          relationshipId,
          commandNodeId: node.id,
          snapshotCode: `STRAT_CMD_SNAP:${relationshipId}:${Date.now()}`,
          commandStatus: state.commandStatus,
          commandScore: state.commandScore,
          systemicPressure: state.systemicPressure,
          executiveConcentration: state.executiveConcentration,
          resilienceStrength: state.resilienceStrength,
          diagnostics: { gridCount: gridDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalStrategicCommandEvent.create({
        data: {
          relationshipId,
          commandNodeId: node.id,
          eventType: RelationalStrategicCommandEventType.GRID_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { commandScore: state.commandScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        commandNodeId: node.id,
        nodeCode,
        commandDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.strategic_command.grid_generated",
          intensity: state.commandScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.systemicEscalationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_command.systemic_pressure_detected",
            intensity: state.systemicPressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.executiveOverloadDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_command.executive_concentration_detected",
            intensity: state.executiveConcentration,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.strategicPriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_command.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_command.resilience_detected",
            intensity: state.resilienceStrength,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`strategic command ingestion failed: ${String(err)}`);
    } finally {
      try {
        await this.executiveOperationsIngestion.syncExecutiveOperationsState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "executive_operations_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
      this.ingestActive.delete(relationshipId);
    }
  }

  async archiveStrategicCommandSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalStrategicCommandSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertStrategicCommandMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalStrategicCommandSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalStrategicCommandEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        commandNodeId: snap.commandNodeId,
        eventType: RelationalStrategicCommandEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
