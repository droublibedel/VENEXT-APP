import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalEconomicMonitoringEventType,
  RelationalEconomicMonitoringSignalType,
} from "@prisma/client";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalExecutiveOrchestrationIngestionService } from "../relational-executive-orchestration/relational-executive-orchestration-ingestion.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicMonitoringAlertService } from "./relational-economic-monitoring-alert.service";
import { RelationalEconomicMonitoringCorridorContextService } from "./relational-economic-monitoring-corridor-context.service";
import { RelationalEconomicMonitoringEngineService } from "./relational-economic-monitoring-engine.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";
import { RelationalEconomicMonitoringRealtimeService } from "./relational-economic-monitoring-realtime.service";

@Injectable()
export class RelationalEconomicMonitoringIngestionService {
  private readonly log = new Logger(RelationalEconomicMonitoringIngestionService.name);
  private readonly ingestActive = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicMonitoringPolicyService,
    private readonly corridorContext: RelationalEconomicMonitoringCorridorContextService,
    private readonly engine: RelationalEconomicMonitoringEngineService,
    private readonly alertSvc: RelationalEconomicMonitoringAlertService,
    private readonly realtime: RelationalEconomicMonitoringRealtimeService,
    @Inject(forwardRef(() => RelationalExecutiveOrchestrationIngestionService))
    private readonly executiveOrchestrationIngestion: RelationalExecutiveOrchestrationIngestionService,
  ) {}

  private async monitoringEnabled(relationshipId: string): Promise<boolean> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return false;
    const a = await this.flags.isEnabled("relational_economic_monitoring_enabled", {
      organizationId: rel.requesterOrganizationId,
    });
    const b = await this.flags.isEnabled("relational_economic_monitoring_enabled", {
      organizationId: rel.receiverOrganizationId,
    });
    return a || b;
  }

  /** Instruction 20.33 — chained after economic stabilization (20.32). */
  async syncEconomicMonitoringState(relationshipId: string): Promise<void> {
    if (this.ingestActive.has(relationshipId)) {
      this.log.warn(
        JSON.stringify({ phase: "economic_monitoring_ingestion_loop_guard", relationshipId, mutationSkipped: true }),
      );
      return;
    }
    this.ingestActive.add(relationshipId);
    try {
      if (!(await this.monitoringEnabled(relationshipId))) return;

      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
        select: { corridorState: true, requesterOrganizationId: true, receiverOrganizationId: true },
      });
      if (!rel) return;

      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");

      const mutationGate = this.policy.assertEconomicMonitoringMutationAllowed(rel.corridorState);
      if (!mutationGate.allowed) {
        this.log.warn(JSON.stringify({ relationshipId, ...mutationGate.diagnostics }));
        return;
      }

      const ctx = await this.corridorContext.load(relationshipId);
      if (!ctx.hasOrder || !ctx.buyerOrganizationId || !ctx.sellerOrganizationId) {
        this.log.warn(
          JSON.stringify({
            phase: "economic_monitoring_ingestion_blocked",
            relationshipId,
            mutationSkippedReason: "no_order_for_corridor",
          }),
        );
        return;
      }

      const state = this.engine.computeMonitoringState(ctx);
      const nodeCode = `MON_NODE:${relationshipId}:${Date.now()}`;

      await this.prisma.relationalEconomicMonitoringNode.updateMany({
        where: { relationshipId, active: true },
        data: { active: false },
      });

      const node = await this.prisma.relationalEconomicMonitoringNode.create({
        data: {
          relationshipId,
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
          monitoringType: state.monitoringType,
          monitoringPriority: state.monitoringPriority,
          monitoringStatus: state.monitoringStatus,
          severity: state.severity,
          monitoringScore: state.monitoringScore,
          executivePressure: state.executivePressure,
          systemicRisk: state.systemicRisk,
          resilienceLevel: state.resilienceLevel,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          recoveryPressure: state.recoveryPressure,
          coordinationPressure: state.coordinationPressure,
          dependencyPressure: state.dependencyPressure,
          executiveUrgency: state.executiveUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          diagnostics: {
            ...state.diagnostics,
            criticalExecutiveSignals: state.criticalExecutiveSignals,
            strategicImbalanceDetected: state.strategicImbalanceDetected,
            systemicEscalationDetected: state.systemicEscalationDetected,
          } as Prisma.InputJsonValue,
          metadata: { ingestion: "relational_economic_monitoring.syncEconomicMonitoringState" } as Prisma.InputJsonValue,
        },
      });

      const signalTypes: Array<{ type: RelationalEconomicMonitoringSignalType; intensity: number }> = [
        { type: RelationalEconomicMonitoringSignalType.EXECUTIVE, intensity: state.executivePressure },
        { type: RelationalEconomicMonitoringSignalType.SYSTEMIC, intensity: state.systemicRisk },
        { type: RelationalEconomicMonitoringSignalType.COORDINATION, intensity: state.coordinationPressure },
        { type: RelationalEconomicMonitoringSignalType.RESILIENCE, intensity: state.resilienceLevel },
        { type: RelationalEconomicMonitoringSignalType.PRESSURE, intensity: state.stabilizationPressure },
      ];

      for (const sig of signalTypes) {
        await this.prisma.relationalEconomicMonitoringSignal.create({
          data: {
            monitoringNodeId: node.id,
            relationshipId,
            signalCode: `MON_SIG:${node.id}:${sig.type}:${Date.now()}`,
            signalType: sig.type,
            intensity: sig.intensity,
            pressureLevel: state.executivePressure,
            riskLevel: state.systemicRisk,
            diagnostics: { signal: sig.type } as Prisma.InputJsonValue,
          },
        });
      }

      const alerts = [
        ...this.alertSvc.detectCriticalAlerts(ctx, state),
        ...this.alertSvc.detectStrategicEscalation(ctx, state),
      ];
      const uniqueAlerts = alerts.filter((a, i, arr) => arr.findIndex((x) => x.alertType === a.alertType) === i);

      for (const alert of uniqueAlerts) {
        await this.prisma.relationalEconomicMonitoringAlert.create({
          data: {
            monitoringNodeId: node.id,
            relationshipId,
            alertCode: `${alert.alertCode}:${Date.now()}`,
            alertType: alert.alertType,
            severity: alert.severity,
            priority: alert.priority,
            alertPressure: alert.alertPressure,
            systemicExposure: alert.systemicExposure,
            diagnostics: { alertType: alert.alertType } as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.relationalEconomicMonitoringSnapshot.create({
        data: {
          relationshipId,
          monitoringNodeId: node.id,
          snapshotCode: `MON_SNAP:${relationshipId}:${Date.now()}`,
          monitoringStatus: state.monitoringStatus,
          monitoringScore: state.monitoringScore,
          executivePressure: state.executivePressure,
          systemicRisk: state.systemicRisk,
          resilienceLevel: state.resilienceLevel,
          diagnostics: { alertCount: uniqueAlerts.length } as Prisma.InputJsonValue,
        },
      });

      await this.prisma.relationalEconomicMonitoringEvent.create({
        data: {
          relationshipId,
          monitoringNodeId: node.id,
          eventType: RelationalEconomicMonitoringEventType.EXECUTIVE_ALERT_DETECTED,
          actorOrganizationId: ctx.buyerOrganizationId,
          diagnostics: { monitoringScore: state.monitoringScore } as Prisma.InputJsonValue,
        },
      });

      const publishBase = {
        buyerOrganizationId: ctx.buyerOrganizationId,
        sellerOrganizationId: ctx.sellerOrganizationId,
        relationshipId,
        monitoringNodeId: node.id,
        nodeCode,
        monitoringDepth: 1,
      };

      if (uniqueAlerts.length > 0) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.monitoring.executive_alert_detected",
            intensity: uniqueAlerts[0]!.alertPressure,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicEscalationDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.monitoring.systemic_risk_detected",
            intensity: state.systemicRisk,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.executiveUrgency >= 65) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.monitoring.critical_corridor_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.executiveUrgency >= 55) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.monitoring.priority_detected",
            intensity: state.executiveUrgency,
          })
          .catch((e) => this.log.warn(String(e)));
      }
      if (state.systemicEscalationDetected || state.strategicImbalanceDetected) {
        await this.realtime
          .publishToOrganizations({
            ...publishBase,
            eventType: "relational.monitoring.escalation_detected",
            intensity: Math.max(state.systemicRisk, state.executiveUrgency),
          })
          .catch((e) => this.log.warn(String(e)));
      }
    } catch (err) {
      this.log.warn(`economic monitoring ingestion failed: ${String(err)}`);
    } finally {
      this.ingestActive.delete(relationshipId);
      try {
        await this.executiveOrchestrationIngestion.syncExecutiveOrchestrationState(relationshipId);
      } catch (chainErr) {
        this.log.warn(
          JSON.stringify({
            phase: "executive_orchestration_chain_failed",
            relationshipId,
            error: String(chainErr),
          }),
        );
      }
    }
  }

  async archiveMonitoringSnapshot(snapshotId: string, actorOrganizationId: string): Promise<void> {
    const snap = await this.prisma.relationalEconomicMonitoringSnapshot.findUnique({
      where: { id: snapshotId },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) return;
    const gate = this.policy.assertEconomicMonitoringMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) return;
    await this.prisma.relationalEconomicMonitoringSnapshot.update({
      where: { id: snapshotId },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalEconomicMonitoringEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        monitoringNodeId: snap.monitoringNodeId,
        eventType: RelationalEconomicMonitoringEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId,
        diagnostics: { snapshotId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }
}
