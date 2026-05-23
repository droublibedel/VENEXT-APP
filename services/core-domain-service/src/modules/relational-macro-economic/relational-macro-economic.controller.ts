/**
 * Instruction 20.25 — REST API for relational macro-economic resilience intelligence.
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
import type { Prisma, RelationalMacroEconomicDependency, RelationalMacroEconomicNode } from "@prisma/client";
import { RelationalMacroEconomicEventType } from "@prisma/client";
import {
  RelationalMacroEconomicActionResponseSchema,
  RelationalMacroEconomicDependencyMapSchema,
  RelationalMacroEconomicFragilityMapSchema,
  RelationalMacroEconomicPropagationMapSchema,
  RelationalMacroEconomicResilienceOverviewSchema,
  RelationalMacroEconomicSystemicPressureSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalMacroEconomicCorridorContextService } from "./relational-macro-economic-corridor-context.service";
import { RelationalMacroEconomicFragilityService } from "./relational-macro-economic-fragility.service";
import { RelationalMacroEconomicGuard } from "./relational-macro-economic.guard";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";
import { RelationalMacroEconomicPressureService } from "./relational-macro-economic-pressure.service";
import { RelationalMacroEconomicPropagationService } from "./relational-macro-economic-propagation.service";

@Controller("relational-macro-economic")
@UseGuards(VenextAuthzGuard, RelationalMacroEconomicGuard)
export class RelationalMacroEconomicController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalMacroEconomicPolicyService,
    private readonly corridorContext: RelationalMacroEconomicCorridorContextService,
    private readonly pressure: RelationalMacroEconomicPressureService,
    private readonly fragility: RelationalMacroEconomicFragilityService,
    private readonly propagation: RelationalMacroEconomicPropagationService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_macro_economic_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_macro_economic_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_macro_economic_relationship_not_found" });
  }

  private async buildOverviewDiagnostics(relationshipId: string) {
    const [ctx, map] = await Promise.all([
      this.corridorContext.load(relationshipId),
      this.propagation.buildPropagationMap(relationshipId),
    ]);
    return {
      heuristicFallbackUsed: ctx.heuristicFallbackUsed,
      fallbackReasons: ctx.fallbackReasons,
      predictiveSignalsUsed: ctx.predictiveUnresolvedCount,
      strategicMemoriesUsed: ctx.strategicMemoryActiveCount,
      operationalMetricsUsed: ctx.operationalMetricsUsed,
      supplyFlowNodesUsed: ctx.supplyFlowNodesUsed,
      sectorNodesUsed: ctx.sectorNodesUsed,
      propagationTraversal: map.traversalDiagnostics,
    };
  }

  private nodeWire(n: RelationalMacroEconomicNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      macroNodeCode: n.macroNodeCode,
      territoryCountry: n.territoryCountry,
      territoryCity: n.territoryCity,
      sectorSlug: n.sectorSlug,
      resilienceScore: n.resilienceScore,
      structuralFragility: n.structuralFragility,
      operationalContinuity: n.operationalContinuity,
      dependencyExposure: n.dependencyExposure,
      adaptationCapacity: n.adaptationCapacity,
      systemicPressure: n.systemicPressure,
      economicStress: n.economicStress,
      corridorRecoveryProbability: n.corridorRecoveryProbability,
      macroEconomicRisk: n.macroEconomicRisk,
      propagationRisk: n.propagationRisk,
      fragilityScore: n.fragilityScore,
      resilienceStatus: n.resilienceStatus,
      riskLevel: n.riskLevel,
      active: n.active,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private edgeWire(e: RelationalMacroEconomicDependency) {
    return {
      id: e.id,
      sourceMacroNodeId: e.sourceMacroNodeId,
      targetMacroNodeId: e.targetMacroNodeId,
      dependencyType: e.dependencyType,
      dependencyStrength: e.dependencyStrength,
      propagationProbability: e.propagationProbability,
      systemicExposureScore: e.systemicExposureScore,
      collapseTransferScore: e.collapseTransferScore,
      createdAt: e.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private withDisabledFlags<T extends { score: number }>(items: T[]) {
    return items.map((x) => ({
      ...x,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    }));
  }

  @Get("resilience-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async resilienceOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalMacroEconomicNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalMacroEconomicDependency.findMany({
      where: { sourceNode: { relationshipId } },
      take: 96,
    });
    const active = nodes.filter((n) => n.active);
    const resilienceScore =
      active.length === 0 ? 0 : this.policy.clampInt(active.reduce((s, n) => s + n.resilienceScore, 0) / active.length);
    const structuralFragility =
      active.length === 0
        ? 0
        : this.policy.clampInt(active.reduce((s, n) => s + n.structuralFragility, 0) / active.length);
    const systemicPressure = this.pressure.aggregateSystemicPressure(nodes);
    const macroEconomicRisk =
      active.length === 0
        ? 0
        : this.policy.clampInt(active.reduce((s, n) => s + n.macroEconomicRisk, 0) / active.length);
    const critical = this.pressure.listCriticalCorridors(nodes);
    const { fragileZones } = this.fragility.buildFragilityMaps(nodes);
    const overviewDiagnostics = await this.buildOverviewDiagnostics(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      criticalCorridors: this.withDisabledFlags(critical),
      fragileZones: this.withDisabledFlags(fragileZones),
      resilienceScore,
      structuralFragility,
      systemicPressure,
      macroEconomicRisk,
      overviewDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalMacroEconomicResilienceOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_macro_economic_resilience_overview_invalid" });
    return p.data;
  }

  @Get("fragility-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async fragilityMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalMacroEconomicNode.findMany({ where: { relationshipId }, take: 48 });
    const maps = this.fragility.buildFragilityMaps(nodes);
    const overviewDiagnostics = await this.buildOverviewDiagnostics(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      fragilityByTerritory: maps.fragilityByTerritory,
      fragilityBySector: maps.fragilityBySector,
      fragileZones: this.withDisabledFlags(maps.fragileZones),
      overviewDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalMacroEconomicFragilityMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_macro_economic_fragility_map_invalid" });
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
    const nodes = await this.prisma.relationalMacroEconomicNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalMacroEconomicDependency.findMany({
      where: { sourceNode: { relationshipId } },
      take: 96,
    });
    const dominant = this.pressure.listCriticalCorridors(nodes);
    const collapsePoints = nodes
      .filter((n) => n.active && n.structuralFragility >= 65)
      .map((n) => ({ macroNodeId: n.id, macroNodeCode: n.macroNodeCode, score: n.structuralFragility }))
      .slice(0, 12);
    const systemicExposure =
      edges.length === 0
        ? 0
        : this.policy.clampInt(edges.reduce((s, e) => s + e.systemicExposureScore, 0) / edges.length);
    const overviewDiagnostics = await this.buildOverviewDiagnostics(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      dominantCorridors: this.withDisabledFlags(dominant),
      collapsePoints: this.withDisabledFlags(collapsePoints),
      systemicExposure,
      overviewDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalMacroEconomicDependencyMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_macro_economic_dependency_map_invalid" });
    return p.data;
  }

  @Get("propagation-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async propagationMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalMacroEconomicNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalMacroEconomicDependency.findMany({
      where: { sourceNode: { relationshipId } },
      take: 96,
    });
    const map = await this.propagation.buildPropagationMap(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      cascadePaths: map.cascadePaths,
      maxDepthObserved: map.maxDepthObserved,
      traversalDiagnostics: map.traversalDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalMacroEconomicPropagationMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_macro_economic_propagation_map_invalid" });
    return p.data;
  }

  @Get("critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async criticalCorridors(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string,
  ) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(relationshipId)) {
      throw new BadRequestException({ code: "relational_macro_economic_missing_relationship" });
    }
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalMacroEconomicNode.findMany({ where: { relationshipId }, take: 48 });
    return {
      relationshipId,
      criticalCorridors: this.withDisabledFlags(this.pressure.listCriticalCorridors(nodes)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async systemicPressure(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string,
  ) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(relationshipId)) {
      throw new BadRequestException({ code: "relational_macro_economic_missing_relationship" });
    }
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalMacroEconomicNode.findMany({ where: { relationshipId }, take: 48 });
    const active = nodes.filter((n) => n.active);
    const signals = await this.prisma.relationalMacroEconomicPressureSignal.findMany({
      where: { relationshipId },
      take: 24,
      orderBy: { createdAt: "desc" },
    });
    const raw = {
      relationshipId,
      systemicPressure: this.pressure.aggregateSystemicPressure(nodes),
      economicStress:
        active.length === 0
          ? 0
          : this.policy.clampInt(active.reduce((s, n) => s + n.economicStress, 0) / active.length),
      macroEconomicRisk:
        active.length === 0
          ? 0
          : this.policy.clampInt(active.reduce((s, n) => s + n.macroEconomicRisk, 0) / active.length),
      signals: signals.map((s) => ({
        signalType: s.signalType,
        severity: s.severity,
        signalScore: s.signalScore,
        title: s.title,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalMacroEconomicSystemicPressureSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_macro_economic_systemic_pressure_invalid" });
    return p.data;
  }

  @Post("archive-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalMacroEconomicResilienceSnapshot.findUnique({
      where: { id },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) throw new NotFoundException({ code: "relational_macro_economic_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    await this.governance.assertCorridorOperational(snap.relationshipId, "operational_observation");
    const mutationGate = this.policy.assertMacroEconomicMutationAllowed(snap.relationship.corridorState);
    if (!mutationGate.allowed) {
      throw new ForbiddenException({ code: "relational_macro_economic_corridor_readonly", detail: mutationGate.diagnostics });
    }
    await this.prisma.relationalMacroEconomicResilienceSnapshot.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalMacroEconomicEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        macroNodeId: snap.macroNodeId,
        eventType: RelationalMacroEconomicEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId: organizationId,
        diagnostics: { snapshotId: id } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
    const raw = {
      ok: true as const,
      code: "relational_macro_economic_snapshot_archived",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalMacroEconomicActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_macro_economic_action_invalid" });
    return p.data;
  }
}
