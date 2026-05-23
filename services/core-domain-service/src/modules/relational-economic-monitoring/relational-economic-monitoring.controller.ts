/**
 * Instruction 20.33 — REST API for relational economic monitoring (non-autopilot).
 */
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type {
  RelationalEconomicMonitoringAlert,
  RelationalEconomicMonitoringNode,
  RelationalEconomicMonitoringSignal,
} from "@prisma/client";
import {
  RelationalEconomicMonitoringActionResponseSchema,
  RelationalEconomicMonitoringOverviewSchema,
  RelationalEconomicMonitoringSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicMonitoringCorridorContextService } from "./relational-economic-monitoring-corridor-context.service";
import { RelationalEconomicMonitoringEngineService } from "./relational-economic-monitoring-engine.service";
import { RelationalEconomicMonitoringGuard } from "./relational-economic-monitoring.guard";
import { RelationalEconomicMonitoringIngestionService } from "./relational-economic-monitoring-ingestion.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";

@Controller("relational-economic-monitoring")
@UseGuards(VenextAuthzGuard, RelationalEconomicMonitoringGuard)
export class RelationalEconomicMonitoringController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicMonitoringPolicyService,
    private readonly corridorContext: RelationalEconomicMonitoringCorridorContextService,
    private readonly engine: RelationalEconomicMonitoringEngineService,
    private readonly ingestion: RelationalEconomicMonitoringIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_monitoring_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_monitoring_disabled" });
    }
  }

  private async assertOrgOnRelationship(organizationId: string, relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findFirst({
      where: {
        id: relationshipId,
        OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
      },
      select: { id: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_economic_monitoring_relationship_not_found" });
  }

  private nodeWire(n: RelationalEconomicMonitoringNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      monitoringType: n.monitoringType,
      monitoringPriority: n.monitoringPriority,
      monitoringStatus: n.monitoringStatus,
      severity: n.severity,
      monitoringScore: n.monitoringScore,
      executivePressure: n.executivePressure,
      systemicRisk: n.systemicRisk,
      resilienceLevel: n.resilienceLevel,
      governancePressure: n.governancePressure,
      arbitrationPressure: n.arbitrationPressure,
      stabilizationPressure: n.stabilizationPressure,
      sovereigntyPressure: n.sovereigntyPressure,
      recoveryPressure: n.recoveryPressure,
      coordinationPressure: n.coordinationPressure,
      dependencyPressure: n.dependencyPressure,
      executiveUrgency: n.executiveUrgency,
      territoryCountry: n.territoryCountry,
      territoryCity: n.territoryCity,
      sectorSlug: n.sectorSlug,
      active: n.active,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private signalWire(s: RelationalEconomicMonitoringSignal) {
    return {
      id: s.id,
      signalCode: s.signalCode,
      signalType: s.signalType,
      intensity: s.intensity,
      pressureLevel: s.pressureLevel,
      riskLevel: s.riskLevel,
      createdAt: s.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private alertWire(a: RelationalEconomicMonitoringAlert) {
    return {
      id: a.id,
      alertCode: a.alertCode,
      alertType: a.alertType,
      severity: a.severity,
      priority: a.priority,
      alertPressure: a.alertPressure,
      systemicExposure: a.systemicExposure,
      createdAt: a.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("monitoring-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async monitoringOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalEconomicMonitoringNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeMonitoringState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `MON_NODE:${relationshipId}:preview`,
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
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        },
        signals: [],
        alerts: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          signalCount: 0,
          alertCount: 0,
          strategicImbalanceDetected: state.strategicImbalanceDetected,
          systemicEscalationDetected: state.systemicEscalationDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalEconomicMonitoringOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_economic_monitoring_overview_invalid" });
      return p.data;
    }
    const [signals, alerts] = await Promise.all([
      this.prisma.relationalEconomicMonitoringSignal.findMany({ where: { monitoringNodeId: node.id } }),
      this.prisma.relationalEconomicMonitoringAlert.findMany({ where: { monitoringNodeId: node.id } }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      alerts: alerts.map((a) => this.alertWire(a)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: signals.length,
        alertCount: alerts.length,
        strategicImbalanceDetected: false,
        systemicEscalationDetected: node.systemicRisk >= 70,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicMonitoringOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_monitoring_overview_invalid" });
    return p.data;
  }

  @Get("monitoring-alerts/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async monitoringAlerts(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const alerts = await this.prisma.relationalEconomicMonitoringAlert.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      alerts: alerts.map((a) => this.alertWire(a)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("monitoring-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async monitoringSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalEconomicMonitoringNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    const meanSystemicRisk =
      nodes.length > 0 ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicRisk, 0) / nodes.length) : 0;
    return {
      organizationId,
      meanSystemicRisk,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("monitoring-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async monitoringCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalEconomicMonitoringNode.findMany({
      where: {
        active: true,
        executiveUrgency: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { systemicRisk: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        nodeCode: n.nodeCode,
        executiveUrgency: n.executiveUrgency,
        systemicRisk: n.systemicRisk,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("monitoring-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async monitoringPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalEconomicMonitoringNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { executivePressure: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: nodes.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        executiveUrgency: n.executiveUrgency,
        monitoringScore: n.monitoringScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("monitoring-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async monitoringBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalEconomicMonitoringNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    const meanScore =
      nodes.length > 0 ? this.policy.clampInt(nodes.reduce((a, n) => a + n.monitoringScore, 0) / nodes.length) : 0;
    const meanResilience =
      nodes.length > 0 ? this.policy.clampInt(nodes.reduce((a, n) => a + n.resilienceLevel, 0) / nodes.length) : 0;
    return {
      organizationId,
      balanceScore: meanScore,
      resilienceLevel: meanResilience,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("monitoring-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async monitoringHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalEconomicMonitoringSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalEconomicMonitoringSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          monitoringStatus: s.monitoringStatus,
          monitoringScore: s.monitoringScore,
          executivePressure: s.executivePressure,
          systemicRisk: s.systemicRisk,
          resilienceLevel: s.resilienceLevel,
          createdAt: s.createdAt.toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        }),
      ),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Post("archive-monitoring-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveMonitoringSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalEconomicMonitoringSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_economic_monitoring_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_economic_monitoring_relationship_not_found" });
    const gate = this.policy.assertEconomicMonitoringMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_monitoring_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveMonitoringSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalEconomicMonitoringActionResponseSchema.safeParse({
      ok: true,
      code: "relational_economic_monitoring_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_economic_monitoring_action_invalid" });
    return p.data;
  }
}
