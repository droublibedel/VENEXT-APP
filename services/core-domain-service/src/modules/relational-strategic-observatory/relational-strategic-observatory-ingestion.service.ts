import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalStrategicObservatoryEventType,
  RelationalStrategicObservatorySignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalStrategicObservatoryCorridorContextService } from "./relational-strategic-observatory-corridor-context.service";
import { RelationalStrategicObservatoryEngineService } from "./relational-strategic-observatory-engine.service";
import { RelationalStrategicObservatoryGridService } from "./relational-strategic-observatory-grid.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";
import { RelationalStrategicObservatoryRealtimeService } from "./relational-strategic-observatory-realtime.service";
import { RelationalMacroObservatoryGovernanceIngestionService } from "../relational-macro-observatory-governance/relational-macro-observatory-governance-ingestion.service";

@Injectable()
export class RelationalStrategicObservatoryIngestionService {
  private readonly log = new Logger(RelationalStrategicObservatoryIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalStrategicObservatoryPolicyService,
    private readonly corridorContext: RelationalStrategicObservatoryCorridorContextService,
    private readonly engine: RelationalStrategicObservatoryEngineService,
    private readonly gridSvc: RelationalStrategicObservatoryGridService,
    private readonly realtime: RelationalStrategicObservatoryRealtimeService,
    @Inject(forwardRef(() => RelationalMacroObservatoryGovernanceIngestionService))
    private readonly macroObservatoryGovernanceIngestion: RelationalMacroObservatoryGovernanceIngestionService,
  ) {}

  private async commandEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_strategic_observatory_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_strategic_observatory_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.40 — chained after executive control room (20.39). */
  async syncStrategicObservatoryState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "strategic_observatory_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
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

      const mutationGate = this.policy.assertStrategicObservatoryMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "strategic_observatory_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeStrategicObservatoryState(ctx);
      const nodeCode = `STRAT_OBSERV_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalStrategicObservatoryNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalStrategicObservatoryNode.create({
        data: {
          relationshipId,
          globalExecutiveSupervisionNodeId: ctx.activeGlobalExecutiveSupervisionNodeId,
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
          observatoryType: state.observatoryType,
          observatoryPriority: state.observatoryPriority,
          observatoryStatus: state.observatoryStatus,
          severity: state.severity,
          observatoryScore: state.observatoryScore,
          executiveExposure: state.executiveExposure,
          systemicPressure: state.systemicPressure,
          resilienceStrength: state.resilienceStrength,
          strategicCoordinationPressure: state.strategicCoordinationPressure,
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
            executiveInstabilityDetected: state.executiveInstabilityDetected,
            systemicConcentrationDetected: state.systemicConcentrationDetected,
            observatoryPriorityDetected: state.observatoryPriorityDetected,
            resilienceDetected: state.resilienceDetected,
            strategicCollapseRiskDetected: state.strategicCollapseRiskDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_strategic_observatory.syncStrategicObservatoryState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalStrategicObservatorySignalType; intensity: number }> = [
        { type: RelationalStrategicObservatorySignalType.OBSERVATORY, intensity: state.observatoryScore },
        { type: RelationalStrategicObservatorySignalType.EXECUTIVE, intensity: state.executiveExposure },
        { type: RelationalStrategicObservatorySignalType.SYSTEMIC, intensity: state.systemicPressure },
        { type: RelationalStrategicObservatorySignalType.RESILIENCE, intensity: state.resilienceStrength },
        { type: RelationalStrategicObservatorySignalType.BALANCE, intensity: state.strategicAlignmentScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalStrategicObservatorySignal.create({
          data: {
            strategicObservatoryNodeId: node.id,
            relationshipId,
            signalCode: `STRAT_OBSERV_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.systemicPressure,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const gridDrafts = this.gridSvc.generateStrategicObservatoryGrids(ctx, state);
      for (const grid of gridDrafts) {
        await this.prisma.relationalStrategicObservatoryGrid.create({
          data: {
            strategicObservatoryNodeId: node.id,
            relationshipId,
            gridCode: `${grid.gridCode}:${Date.now()}`,
            gridType: grid.gridType,
            severity: grid.severity,
            priority: grid.priority,
            title: grid.title,
            summary: grid.summary,
            institutionalPressure: grid.institutionalPressure,
            executiveExposure: grid.executiveExposure,
            diagnostics: { template: true } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalStrategicObservatorySnapshot.create({
        data: {
          relationshipId,
          strategicObservatoryNodeId: node.id,
          snapshotCode: `STRAT_OBSERV_SNAP:${relationshipId}:${Date.now()}`,
          observatoryStatus: state.observatoryStatus,
          observatoryScore: state.observatoryScore,
          executiveExposure: state.executiveExposure,
          systemicPressure: state.systemicPressure,
          resilienceStrength: state.resilienceStrength,
          diagnostics: { gridCount: gridDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalStrategicObservatoryEvent.create({
        data: {
          relationshipId,
          strategicObservatoryNodeId: node.id,
          eventType: RelationalStrategicObservatoryEventType.GRID_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { observatoryScore: state.observatoryScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        strategicObservatoryNodeId: node.id,
        nodeCode,
        observatoryDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.strategic_observatory.grid_generated",
          intensity: state.observatoryScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.executiveInstabilityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_observatory.executive_pressure_detected",
            intensity: state.executiveExposure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicConcentrationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_observatory.systemic_concentration_detected",
            intensity: state.systemicPressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.observatoryPriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_observatory.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.strategic_observatory.resilience_detected",
            intensity: state.resilienceStrength,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`strategic observatory ingestion failed: ${String(err)}`);
    } finally {
      try {
        await this.macroObservatoryGovernanceIngestion.syncMacroObservatoryGovernanceState(relationshipId);
      } catch (chainErr) {
        this.log.error("macro_observatory_governance_chain_failed", {
          relationshipId,
          error: chainErr,
        });
      }
      this.ingestActive.delete(relationshipId);
    }
  }

  async archiveStrategicObservatorySnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalStrategicObservatorySnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertStrategicObservatoryMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalStrategicObservatorySnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalStrategicObservatoryEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        strategicObservatoryNodeId: snap.strategicObservatoryNodeId,
        eventType: RelationalStrategicObservatoryEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
