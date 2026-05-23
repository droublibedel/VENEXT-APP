import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalEconomicStabilizationEventType,
  RelationalEconomicStabilizationSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicMonitoringIngestionService } from "../relational-economic-monitoring/relational-economic-monitoring-ingestion.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicStabilizationCorridorContextService } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationDependencyService } from "./relational-economic-stabilization-dependency.service";
import { RelationalEconomicStabilizationEngineService } from "./relational-economic-stabilization-engine.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";
import { RelationalEconomicStabilizationRealtimeService } from "./relational-economic-stabilization-realtime.service";
import { VENEXT_STABILIZATION_MAX_DEPTH } from "./relational-economic-stabilization-policy.service";

@Injectable()
export class RelationalEconomicStabilizationIngestionService {
  private readonly log = new Logger(RelationalEconomicStabilizationIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicStabilizationPolicyService,
    private readonly corridorContext: RelationalEconomicStabilizationCorridorContextService,
    private readonly engine: RelationalEconomicStabilizationEngineService,
    private readonly dependencySvc: RelationalEconomicStabilizationDependencyService,
    private readonly realtime: RelationalEconomicStabilizationRealtimeService,
    @Inject(forwardRef(() => RelationalEconomicMonitoringIngestionService))
    private readonly monitoringIngestion: RelationalEconomicMonitoringIngestionService,
  ) {}

  private async stabilizationEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_stabilization_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_stabilization_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.32 — chained after economic arbitration (20.31). */
  async syncEconomicStabilizationState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "economic_stabilization_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.stabilizationEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true, requesterOrganizationId: true, receiverOrganizationId: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertEconomicStabilizationMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_stabilization_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeStabilizationState(ctx);
      const traversal = await this.dependencySvc.traversePeerCorridors(ctx);
      const depDrafts = this.dependencySvc.detectCriticalDependencies(ctx);
      const nodeCode = `STAB_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalEconomicStabilizationNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalEconomicStabilizationNode.create({
        data: {
          relationshipId,
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
          stabilizationType: state.stabilizationType,
          stabilizationPriority: state.stabilizationPriority,
          stabilizationStatus: state.stabilizationStatus,
          severity: state.severity,
          stabilizationScore: state.stabilizationScore,
          instabilityPressure: state.instabilityPressure,
          resilienceLevel: state.resilienceLevel,
          systemicExposure: state.systemicExposure,
          dependencyPressure: state.dependencyPressure,
          continuityPressure: state.continuityPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          arbitrationPressure: state.arbitrationPressure,
          governancePressure: state.governancePressure,
          recoveryPressure: state.recoveryPressure,
          coordinationStress: state.coordinationStress,
          stabilizationUrgency: state.stabilizationUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            traversal,
            strategicInstabilityDetected: state.strategicInstabilityDetected,
            systemicCollapseRiskDetected: state.systemicCollapseRiskDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_economic_stabilization.syncEconomicStabilizationState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalEconomicStabilizationSignalType; intensity: number }> = [
        { type: RelationalEconomicStabilizationSignalType.INSTABILITY, intensity: state.instabilityPressure },
        { type: RelationalEconomicStabilizationSignalType.RESILIENCE, intensity: state.resilienceLevel },
        { type: RelationalEconomicStabilizationSignalType.PRESSURE, intensity: state.governancePressure },
        { type: RelationalEconomicStabilizationSignalType.EXPOSURE, intensity: state.systemicExposure },
        { type: RelationalEconomicStabilizationSignalType.COORDINATION, intensity: state.coordinationStress },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalEconomicStabilizationSignal.create({
          data: {
            stabilizationNodeId: node.id,
            relationshipId,
            signalCode: `STAB_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.instabilityPressure,
            exposureLevel: state.systemicExposure,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      for (const dep of depDrafts) {
        await this.prisma.relationalEconomicStabilizationDependency.create({
          data: {
            sourceStabilizationNodeId: node.id,
            relationshipId,
            dependencyCode: `${dep.dependencyCode}:${Date.now()}`,
            dependencyWeight: dep.dependencyWeight,
            crossCorridorExposure: dep.crossCorridorExposure,
            propagationStress: dep.propagationStress,
            concentrationScore: dep.concentrationScore,
            diagnostics: { targetRef: dep.targetRef } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalEconomicStabilizationSnapshot.create({
        data: {
          relationshipId,
          stabilizationNodeId: node.id,
          snapshotCode: `STAB_SNAP:${relationshipId}:${Date.now()}`,
          stabilizationStatus: state.stabilizationStatus,
          stabilizationScore: state.stabilizationScore,
          instabilityPressure: state.instabilityPressure,
          resilienceLevel: state.resilienceLevel,
          systemicExposure: state.systemicExposure,
          diagnostics: { traversalDepth: traversal.traversalDepth } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalEconomicStabilizationEvent.create({
        data: {
          relationshipId,
          stabilizationNodeId: node.id,
          eventType: RelationalEconomicStabilizationEventType.STABILITY_DETECTED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { stabilizationScore: state.stabilizationScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        stabilizationNodeId: node.id,
        nodeCode,
        stabilizationDepth: Math.min(traversal.traversalDepth, VENEXT_STABILIZATION_MAX_DEPTH),
      };

      await this.realtime
        .publishToOrganizations({ ...publishBase, eventType: "relational.stabilization.stability_detected", intensity: state.stabilizationScore })
        .catch((e) => this.log.warn(String(e)));

      if (state.strategicInstabilityDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.stabilization.instability_detected",
            intensity: state.instabilityPressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.resilienceLevel >= 55) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.stabilization.resilience_detected",
            intensity: state.resilienceLevel,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.stabilizationUrgency >= 60) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.stabilization.priority_detected",
            intensity: state.stabilizationUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicCollapseRiskDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.stabilization.systemic_risk_detected",
            intensity: state.systemicExposure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`economic stabilization ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.monitoringIngestion.syncEconomicMonitoringState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_monitoring_chain_from_stabilization",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }

  async archiveStabilizationSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalEconomicStabilizationSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertEconomicStabilizationMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalEconomicStabilizationSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalEconomicStabilizationEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        stabilizationNodeId: snap.stabilizationNodeId,
        eventType: RelationalEconomicStabilizationEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
