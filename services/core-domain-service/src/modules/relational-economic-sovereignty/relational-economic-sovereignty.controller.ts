/**
 * Instruction 20.27 — REST API for relational economic sovereignty intelligence.
 */
import {
  BadRequestException,
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
import type { Prisma, RelationalEconomicSovereigntyDependency, RelationalEconomicSovereigntyNode } from "@prisma/client";
import { RelationalEconomicSovereigntyEventType } from "@prisma/client";
import {
  RelationalEconomicSovereigntyActionResponseSchema,
  RelationalEconomicSovereigntyAutonomyDistributionSchema,
  RelationalEconomicSovereigntyAutonomyMapSchema,
  RelationalEconomicSovereigntyCaptivityDistributionSchema,
  RelationalEconomicSovereigntyCaptivityMapSchema,
  RelationalEconomicSovereigntyDashboardSchema,
  RelationalEconomicSovereigntyDependencyConcentrationSchema,
  RelationalEconomicSovereigntyDependencyMapSchema,
  RelationalEconomicSovereigntyOverviewSchema,
  RelationalEconomicSovereigntyResilienceAutonomySchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicSovereigntyAutonomyService } from "./relational-economic-sovereignty-autonomy.service";
import { RelationalEconomicSovereigntyCaptivityService } from "./relational-economic-sovereignty-captivity.service";
import { RelationalEconomicSovereigntyDashboardService } from "./relational-economic-sovereignty-dashboard.service";
import { RelationalEconomicSovereigntyRealtimeService } from "./relational-economic-sovereignty-realtime.service";
import { RelationalEconomicSovereigntyCorridorContextService } from "./relational-economic-sovereignty-corridor-context.service";
import { RelationalEconomicSovereigntyGuard } from "./relational-economic-sovereignty.guard";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";
import { RelationalEconomicSovereigntyRecoveryService } from "./relational-economic-sovereignty-recovery.service";
import { RelationalEconomicSovereigntyResilienceService } from "./relational-economic-sovereignty-resilience.service";

@Controller("relational-economic-sovereignty")
@UseGuards(VenextAuthzGuard, RelationalEconomicSovereigntyGuard)
export class RelationalEconomicSovereigntyController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly corridorContext: RelationalEconomicSovereigntyCorridorContextService,
    private readonly autonomy: RelationalEconomicSovereigntyAutonomyService,
    private readonly recovery: RelationalEconomicSovereigntyRecoveryService,
    private readonly resilience: RelationalEconomicSovereigntyResilienceService,
    private readonly captivity: RelationalEconomicSovereigntyCaptivityService,
    private readonly dashboard: RelationalEconomicSovereigntyDashboardService,
    private readonly sovereigntyRealtime: RelationalEconomicSovereigntyRealtimeService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_sovereignty_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_sovereignty_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_economic_sovereignty_relationship_not_found" });
  }

  private async buildOverviewDiagnostics(relationshipId: string) {
    const [ctx, map] = await Promise.all([
      this.corridorContext.load(relationshipId),
      this.recovery.buildRecoveryTraversal(relationshipId),
    ]);
    return {
      heuristicFallbackUsed: ctx.heuristicFallbackUsed,
      fallbackReasons: ctx.fallbackReasons,
      continuitySnapshotsUsed: ctx.continuitySnapshotCount,
      macroDependenciesUsed: ctx.macroDependencyCount,
      supplyFlowEdgesUsed: ctx.supplyFlowEdgeCount,
      strategicMemoriesUsed: ctx.strategicMemoryActiveCount,
      recoveryTraversal: map.recoveryDiagnostics,
    };
  }

  private nodeWire(n: RelationalEconomicSovereigntyNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      sovereigntyNodeCode: n.sovereigntyNodeCode,
      territoryCountry: n.territoryCountry,
      territoryCity: n.territoryCity,
      sectorSlug: n.sectorSlug,
      sovereigntyScore: n.sovereigntyScore,
      autonomyScore: n.autonomyScore,
      dependencyExposureScore: n.dependencyExposureScore,
      dependencyExposureLevel: n.dependencyExposureLevel,
      dependencyConcentration: n.dependencyConcentration,
      externalDependencyExposure: n.externalDependencyExposure,
      resilienceAutonomy: n.resilienceAutonomy,
      recoveryAutonomy: n.recoveryAutonomy,
      strategicCaptivityRisk: n.strategicCaptivityRisk,
      corridorSelfRecoveryProbability: n.corridorSelfRecoveryProbability,
      dependencyCriticality: n.dependencyCriticality,
      systemicAutonomyRisk: n.systemicAutonomyRisk,
      autonomyStatus: n.autonomyStatus,
      severity: n.severity,
      active: n.active,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private edgeWire(e: RelationalEconomicSovereigntyDependency) {
    return {
      id: e.id,
      sourceSovereigntyNodeId: e.sourceSovereigntyNodeId,
      targetSovereigntyNodeId: e.targetSovereigntyNodeId,
      exposureLevel: e.exposureLevel,
      dependencyConcentration: e.dependencyConcentration,
      captivityTransferScore: e.captivityTransferScore,
      autonomyRecoveryProbability: e.autonomyRecoveryProbability,
      createdAt: e.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private withFlags<T extends { score: number }>(items: T[]) {
    return items.map((x) => ({
      ...x,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    }));
  }

  @Get("sovereignty-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async sovereigntyOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalEconomicSovereigntyNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalEconomicSovereigntyDependency.findMany({
      where: { sourceNode: { relationshipId } },
      take: 96,
    });
    const active = nodes.filter((n) => n.active);
    const avg = (field: keyof RelationalEconomicSovereigntyNode) =>
      active.length === 0 ? 0 : this.policy.clampInt(active.reduce((s, n) => s + Number(n[field]), 0) / active.length);
    const autonomous = active
      .filter((n) => n.autonomyScore >= 68)
      .map((n) => ({ sovereigntyNodeId: n.id, sovereigntyNodeCode: n.sovereigntyNodeCode, score: n.autonomyScore }))
      .slice(0, 12);
    const captive = active
      .filter((n) => n.strategicCaptivityRisk >= 58)
      .map((n) => ({ sovereigntyNodeId: n.id, sovereigntyNodeCode: n.sovereigntyNodeCode, score: n.strategicCaptivityRisk }))
      .slice(0, 12);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      autonomousCorridors: this.withFlags(autonomous),
      captiveCorridors: this.withFlags(captive),
      sovereigntyScore: avg("sovereigntyScore"),
      autonomyScore: avg("autonomyScore"),
      dependencyExposureScore: avg("dependencyExposureScore"),
      systemicAutonomyRisk: avg("systemicAutonomyRisk"),
      corridorSelfRecoveryProbability:
        active.length === 0
          ? 0.05
          : this.policy.clampProb(active.reduce((s, n) => s + n.corridorSelfRecoveryProbability, 0) / active.length),
      overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicSovereigntyOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_overview_invalid" });
    return p.data;
  }

  @Get("dependency-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async dependencyMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalEconomicSovereigntyNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalEconomicSovereigntyDependency.findMany({
      where: { sourceNode: { relationshipId } },
      take: 96,
    });
    const active = nodes.filter((n) => n.active);
    const critical = active
      .filter((n) => n.dependencyCriticality >= 60)
      .map((n) => ({ sovereigntyNodeId: n.id, sovereigntyNodeCode: n.sovereigntyNodeCode, score: n.dependencyCriticality }))
      .slice(0, 12);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      dependencyConcentration:
        active.length === 0 ? 0 : this.policy.clampInt(active.reduce((s, n) => s + n.dependencyConcentration, 0) / active.length),
      externalDependencyExposure:
        active.length === 0
          ? 0
          : this.policy.clampInt(active.reduce((s, n) => s + n.externalDependencyExposure, 0) / active.length),
      dependencyCriticality:
        active.length === 0 ? 0 : this.policy.clampInt(active.reduce((s, n) => s + n.dependencyCriticality, 0) / active.length),
      criticalDependencies: this.withFlags(critical),
      overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicSovereigntyDependencyMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_dependency_map_invalid" });
    return p.data;
  }

  @Get("captivity-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async captivityMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalEconomicSovereigntyNode.findMany({ where: { relationshipId }, take: 48 });
    const captivityByTerritory: Record<string, number> = {};
    for (const n of nodes.filter((x) => x.active)) {
      captivityByTerritory[n.territoryCountry] = Math.max(
        captivityByTerritory[n.territoryCountry] ?? 0,
        n.strategicCaptivityRisk,
      );
    }
    const captive = nodes
      .filter((n) => n.active && n.strategicCaptivityRisk >= 58)
      .map((n) => ({ sovereigntyNodeId: n.id, sovereigntyNodeCode: n.sovereigntyNodeCode, score: n.strategicCaptivityRisk }))
      .slice(0, 12);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      captiveCorridors: this.withFlags(captive),
      strategicCaptivityRisk:
        nodes.length === 0
          ? 0
          : this.policy.clampInt(
              nodes.filter((n) => n.active).reduce((s, n) => s + n.strategicCaptivityRisk, 0) /
                Math.max(1, nodes.filter((n) => n.active).length),
            ),
      captivityByTerritory,
      overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicSovereigntyCaptivityMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_captivity_map_invalid" });
    return p.data;
  }

  @Get("autonomy-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async autonomyMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalEconomicSovereigntyNode.findMany({ where: { relationshipId }, take: 48 });
    const autonomyBySector: Record<string, number> = {};
    const autonomyByTerritory: Record<string, number> = {};
    for (const n of nodes.filter((x) => x.active)) {
      const sKey = n.sectorSlug ?? "UNSECTORED";
      autonomyBySector[sKey] = Math.max(autonomyBySector[sKey] ?? 0, n.autonomyScore);
      autonomyByTerritory[n.territoryCountry] = Math.max(autonomyByTerritory[n.territoryCountry] ?? 0, n.autonomyScore);
    }
    const active = nodes.filter((n) => n.active);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      autonomyBySector,
      autonomyByTerritory,
      resilienceAutonomy:
        active.length === 0 ? 0 : this.policy.clampInt(active.reduce((s, n) => s + n.resilienceAutonomy, 0) / active.length),
      recoveryAutonomy:
        active.length === 0 ? 0 : this.policy.clampInt(active.reduce((s, n) => s + n.recoveryAutonomy, 0) / active.length),
      overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicSovereigntyAutonomyMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_autonomy_map_invalid" });
    return p.data;
  }

  @Get("resilience-autonomy/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async resilienceAutonomy(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const ctx = await this.corridorContext.load(relationshipId);
    const scores = this.autonomy.computeAutonomy(ctx);
    const map = await this.recovery.buildRecoveryTraversal(relationshipId);
    const recoveryProj = this.recovery.computeRecoveryAutonomy(scores, map.recoveryDiagnostics);
    const resilienceProj = this.resilience.projectResilienceAutonomy(scores, map.recoveryDiagnostics);
    const raw = {
      relationshipId,
      resilienceAutonomy: resilienceProj.resilienceAutonomyProjection,
      recoveryAutonomy: scores.recoveryAutonomy,
      corridorSelfRecoveryProbability: recoveryProj.corridorSelfRecoveryProbability,
      dependencyRecoveryComplexity: recoveryProj.dependencyRecoveryComplexity,
      autonomyRecoveryPressure: resilienceProj.autonomyRecoveryPressure,
      recoveryDiagnostics: map.recoveryDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicSovereigntyResilienceAutonomySchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_resilience_autonomy_invalid" });
    return p.data;
  }

  @Get("sovereignty-dashboard")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async sovereigntyDashboard(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const raw = await this.dashboard.buildSovereigntyDashboard(organizationId);
    const p = RelationalEconomicSovereigntyDashboardSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_dashboard_invalid" });
    await this.sovereigntyRealtime
      .publishToOrganizations({
        buyerOrganizationId: organizationId,
        sellerOrganizationId: organizationId,
        relationshipId: null,
        sovereigntyNodeId: null,
        sovereigntyNodeCode: null,
        intensity: raw.corridorCount,
        autonomyDepth: 0,
        eventType: "relational.sovereignty.dashboard_refreshed",
      })
      .catch(() => undefined);
    return p.data;
  }

  @Get("systemic-captivity")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async systemicCaptivity(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const raw = await this.dashboard.buildSystemicCaptivity(organizationId);
    const p = RelationalEconomicSovereigntyCaptivityDistributionSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_systemic_captivity_invalid" });
    return p.data;
  }

  @Get("autonomy-distribution")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async autonomyDistribution(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const raw = await this.dashboard.buildAutonomyDistribution(organizationId);
    const p = RelationalEconomicSovereigntyAutonomyDistributionSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_autonomy_distribution_invalid" });
    return p.data;
  }

  @Get("dependency-concentration")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async dependencyConcentration(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const raw = await this.dashboard.buildDependencyConcentration(organizationId);
    const p = RelationalEconomicSovereigntyDependencyConcentrationSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_dependency_concentration_invalid" });
    return p.data;
  }

  @Get("critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async criticalCorridors(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string,
  ) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(relationshipId)) {
      throw new BadRequestException({ code: "relational_economic_sovereignty_missing_relationship" });
    }
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const critical = await this.captivity.listCriticalCorridors(organizationId);
    return {
      relationshipId,
      criticalCorridors: critical
        .filter((c) => c.relationshipId === relationshipId)
        .map((c) => ({
          sovereigntyNodeId: c.id,
          sovereigntyNodeCode: c.sovereigntyNodeCode,
          score: c.strategicCaptivityRisk,
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Post("archive-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalEconomicSovereigntySnapshot.findUnique({
      where: { id },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) throw new NotFoundException({ code: "relational_economic_sovereignty_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    await this.governance.assertCorridorOperational(snap.relationshipId, "operational_observation");
    const mutationGate = this.policy.assertEconomicSovereigntyMutationAllowed(snap.relationship.corridorState);
    if (!mutationGate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_sovereignty_corridor_readonly",
        detail: mutationGate.diagnostics,
      });
    }
    await this.prisma.relationalEconomicSovereigntySnapshot.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalEconomicSovereigntyEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        sovereigntyNodeId: snap.sovereigntyNodeId,
        eventType: RelationalEconomicSovereigntyEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId: organizationId,
        diagnostics: { snapshotId: id } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
    const raw = {
      ok: true as const,
      code: "relational_economic_sovereignty_snapshot_archived",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicSovereigntyActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_sovereignty_action_invalid" });
    return p.data;
  }
}
