import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalMacroObservatoryGovernanceEventType,
  RelationalMacroObservatoryGovernanceSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalMacroObservatoryGovernanceCorridorContextService } from "./relational-macro-observatory-governance-corridor-context.service";
import { RelationalMacroObservatoryGovernanceEngineService } from "./relational-macro-observatory-governance-engine.service";
import { RelationalMacroObservatoryGovernanceMatrixService } from "./relational-macro-observatory-governance-matrix.service";
import { RelationalMacroObservatoryGovernancePolicyService } from "./relational-macro-observatory-governance-policy.service";
import { RelationalMacroObservatoryGovernanceRealtimeService } from "./relational-macro-observatory-governance-realtime.service";

@Injectable()
export class RelationalMacroObservatoryGovernanceIngestionService {
  private readonly log = new Logger(RelationalMacroObservatoryGovernanceIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalMacroObservatoryGovernancePolicyService,
    private readonly corridorContext: RelationalMacroObservatoryGovernanceCorridorContextService,
    private readonly engine: RelationalMacroObservatoryGovernanceEngineService,
    private readonly matrixSvc: RelationalMacroObservatoryGovernanceMatrixService,
    private readonly realtime: RelationalMacroObservatoryGovernanceRealtimeService,
  ) {}

  private async commandEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_macro_observatory_governance_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_macro_observatory_governance_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.40 — chained after executive control room (20.39). */
  async syncMacroObservatoryGovernanceState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "macro_observatory_governance_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
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

      const mutationGate = this.policy.assertMacroObservatoryGovernanceMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "macro_observatory_governance_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeMacroObservatoryGovernanceState(ctx);
      const nodeCode = `MACRO_OBS_GOV_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalMacroObservatoryGovernanceNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalMacroObservatoryGovernanceNode.create({
        data: {
          relationshipId,
          strategicObservatoryNodeId: ctx.activeStrategicObservatoryNodeId,
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
          macroGovernanceType: state.macroGovernanceType,
          macroGovernancePriority: state.macroGovernancePriority,
          macroGovernanceStatus: state.macroGovernanceStatus,
          severity: state.severity,
          macroGovernanceScore: state.macroGovernanceScore,
          executiveCoordinationPressure: state.executiveCoordinationPressure,
          systemicConcentration: state.systemicConcentration,
          resilienceStrength: state.resilienceStrength,
          networkAlignmentPressure: state.networkAlignmentPressure,
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
            networkCoordinationStressDetected: state.networkCoordinationStressDetected,
            executiveAlignmentBreakdownDetected: state.executiveAlignmentBreakdownDetected,
            systemicGovernanceConcentrationDetected: state.systemicGovernanceConcentrationDetected,
            macroGovernancePriorityDetected: state.macroGovernancePriorityDetected,
            resilienceDetected: state.resilienceDetected,
            strategicCollapseRiskDetected: state.strategicCollapseRiskDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_macro_observatory_governance.syncMacroObservatoryGovernanceState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalMacroObservatoryGovernanceSignalType; intensity: number }> = [
        { type: RelationalMacroObservatoryGovernanceSignalType.GOVERNANCE, intensity: state.macroGovernanceScore },
        { type: RelationalMacroObservatoryGovernanceSignalType.EXECUTIVE, intensity: state.executiveCoordinationPressure },
        { type: RelationalMacroObservatoryGovernanceSignalType.SYSTEMIC, intensity: state.systemicConcentration },
        { type: RelationalMacroObservatoryGovernanceSignalType.RESILIENCE, intensity: state.resilienceStrength },
        { type: RelationalMacroObservatoryGovernanceSignalType.BALANCE, intensity: state.strategicAlignmentScore },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalMacroObservatoryGovernanceSignal.create({
          data: {
            macroObservatoryGovernanceNodeId: node.id,
            relationshipId,
            signalCode: `STRAT_OBSERV_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.orchestrationPressure,
            riskLevel: state.systemicConcentration,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const matrixDrafts = this.matrixSvc.generateMacroObservatoryGovernanceMatrices(ctx, state);
      for (const matrix of matrixDrafts) {
        await this.prisma.relationalMacroObservatoryGovernanceMatrix.create({
          data: {
            macroObservatoryGovernanceNodeId: node.id,
            relationshipId,
            matrixCode: `${matrix.matrixCode}:${Date.now()}`,
            matrixType: matrix.matrixType,
            severity: matrix.severity,
            priority: matrix.priority,
            title: matrix.title,
            summary: matrix.summary,
            institutionalPressure: matrix.institutionalPressure,
            executiveCoordinationPressure: matrix.executiveCoordinationPressure,
            diagnostics: { template: true } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalMacroObservatoryGovernanceSnapshot.create({
        data: {
          relationshipId,
          macroObservatoryGovernanceNodeId: node.id,
          snapshotCode: `MACRO_OBS_GOV_SNAP:${relationshipId}:${Date.now()}`,
          macroGovernanceStatus: state.macroGovernanceStatus,
          macroGovernanceScore: state.macroGovernanceScore,
          executiveCoordinationPressure: state.executiveCoordinationPressure,
          systemicConcentration: state.systemicConcentration,
          resilienceStrength: state.resilienceStrength,
          diagnostics: { matrixCount: matrixDrafts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalMacroObservatoryGovernanceEvent.create({
        data: {
          relationshipId,
          macroObservatoryGovernanceNodeId: node.id,
          eventType: RelationalMacroObservatoryGovernanceEventType.MATRIX_GENERATED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { macroGovernanceScore: state.macroGovernanceScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        macroObservatoryGovernanceNodeId: node.id,
        nodeCode,
        governanceDepth: 1,
      };

      await this.realtime
        .publishToOrganizations({
          ...publishBase,
          eventType: "relational.macro_observatory_governance.matrix_generated",
          intensity: state.macroGovernanceScore,
        })
        .catch((e) => this.log.warn(String(e)));

      if (state.executiveAlignmentBreakdownDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.macro_observatory_governance.executive_coordination_detected",
            intensity: state.executiveCoordinationPressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicGovernanceConcentrationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.macro_observatory_governance.systemic_concentration_detected",
            intensity: state.systemicConcentration,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.macroGovernancePriorityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.macro_observatory_governance.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.macro_observatory_governance.resilience_detected",
            intensity: state.resilienceStrength,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`executive strategic synthesis ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
    }
  }

  async archiveMacroObservatoryGovernanceSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalMacroObservatoryGovernanceSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertMacroObservatoryGovernanceMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalMacroObservatoryGovernanceSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalMacroObservatoryGovernanceEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        macroObservatoryGovernanceNodeId: snap.macroObservatoryGovernanceNodeId,
        eventType: RelationalMacroObservatoryGovernanceEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
