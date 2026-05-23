/**
 * Instruction 20.26 — REST API for relational economic continuity intelligence.
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
import type { Prisma, RelationalEconomicContinuityDependency, RelationalEconomicContinuityNode } from "@prisma/client";
import { RelationalEconomicContinuityEventType } from "@prisma/client";
import {
  RelationalEconomicContinuityActionResponseSchema,
  RelationalEconomicContinuityInstabilityMapSchema,
  RelationalEconomicContinuityOverviewSchema,
  RelationalEconomicContinuityRecoveryMapSchema,
  RelationalEconomicContinuityResilienceHistorySchema,
  RelationalEconomicContinuitySystemicPressureSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicContinuityCorridorContextService } from "./relational-economic-continuity-corridor-context.service";
import { RelationalEconomicContinuityGuard } from "./relational-economic-continuity.guard";
import { RelationalEconomicContinuityHistoryService } from "./relational-economic-continuity-history.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";
import { RelationalEconomicContinuityPressureService } from "./relational-economic-continuity-pressure.service";
import { RelationalEconomicContinuityRecoveryService } from "./relational-economic-continuity-recovery.service";
import { RelationalEconomicContinuityRiskService } from "./relational-economic-continuity-risk.service";
import { RelationalEconomicContinuityStabilityService } from "./relational-economic-continuity-stability.service";

@Controller("relational-economic-continuity")
@UseGuards(VenextAuthzGuard, RelationalEconomicContinuityGuard)
export class RelationalEconomicContinuityController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicContinuityPolicyService,
    private readonly corridorContext: RelationalEconomicContinuityCorridorContextService,
    private readonly pressure: RelationalEconomicContinuityPressureService,
    private readonly recovery: RelationalEconomicContinuityRecoveryService,
    private readonly history: RelationalEconomicContinuityHistoryService,
    private readonly risk: RelationalEconomicContinuityRiskService,
    private readonly stability: RelationalEconomicContinuityStabilityService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_continuity_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_continuity_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_economic_continuity_relationship_not_found" });
  }

  private async buildOverviewDiagnostics(relationshipId: string) {
    const [ctx, map] = await Promise.all([
      this.corridorContext.load(relationshipId),
      this.recovery.buildRecoveryMap(relationshipId),
    ]);
    return {
      heuristicFallbackUsed: ctx.heuristicFallbackUsed,
      fallbackReasons: ctx.fallbackReasons,
      macroSnapshotsUsed: ctx.macroSnapshotCount,
      continuitySnapshotsUsed: ctx.continuitySnapshotCount,
      propagationEventsUsed: ctx.macroPropagationEventCount,
      strategicMemoriesUsed: ctx.strategicMemoryActiveCount,
      recoveryTraversal: map.recoveryDiagnostics,
    };
  }

  private nodeWire(n: RelationalEconomicContinuityNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      continuityNodeCode: n.continuityNodeCode,
      territoryCountry: n.territoryCountry,
      territoryCity: n.territoryCity,
      sectorSlug: n.sectorSlug,
      continuityScore: n.continuityScore,
      corridorDurability: n.corridorDurability,
      economicStability: n.economicStability,
      instabilityScore: n.instabilityScore,
      continuityPressure: n.continuityPressure,
      dependencyDurability: n.dependencyDurability,
      economicSurvivalProbability: n.economicSurvivalProbability,
      recoveryProbability: n.recoveryProbability,
      systemicContinuityRisk: n.systemicContinuityRisk,
      continuityStatus: n.continuityStatus,
      severity: n.severity,
      active: n.active,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private edgeWire(e: RelationalEconomicContinuityDependency) {
    return {
      id: e.id,
      sourceContinuityNodeId: e.sourceContinuityNodeId,
      targetContinuityNodeId: e.targetContinuityNodeId,
      instabilityType: e.instabilityType,
      dependencyDurability: e.dependencyDurability,
      continuityTransferScore: e.continuityTransferScore,
      recoveryPropagationProbability: e.recoveryPropagationProbability,
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

  @Get("continuity-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async continuityOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalEconomicContinuityNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalEconomicContinuityDependency.findMany({
      where: { sourceNode: { relationshipId } },
      take: 96,
    });
    const active = nodes.filter((n) => n.active);
    const continuityScore =
      active.length === 0 ? 0 : this.policy.clampInt(active.reduce((s, n) => s + n.continuityScore, 0) / active.length);
    const economicStability =
      active.length === 0
        ? 0
        : this.policy.clampInt(active.reduce((s, n) => s + n.economicStability, 0) / active.length);
    const instabilityRisk =
      active.length === 0
        ? 0
        : this.policy.clampInt(active.reduce((s, n) => s + n.instabilityScore, 0) / active.length);
    const systemicContinuityRisk =
      active.length === 0
        ? 0
        : this.policy.clampInt(active.reduce((s, n) => s + n.systemicContinuityRisk, 0) / active.length);
    const recoveryProbability =
      active.length === 0
        ? 0.05
        : this.policy.clampProb(active.reduce((s, n) => s + n.recoveryProbability, 0) / active.length);
    const persistent = active
      .filter((n) => n.corridorDurability >= 65)
      .map((n) => ({ continuityNodeId: n.id, continuityNodeCode: n.continuityNodeCode, score: n.corridorDurability }))
      .slice(0, 12);
    const fragile = active
      .filter((n) => n.instabilityScore >= 58)
      .map((n) => ({ continuityNodeId: n.id, continuityNodeCode: n.continuityNodeCode, score: n.instabilityScore }))
      .slice(0, 12);
    const overviewDiagnostics = await this.buildOverviewDiagnostics(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      persistentCorridors: this.withDisabledFlags(persistent),
      fragileCorridors: this.withDisabledFlags(fragile),
      continuityScore,
      economicStability,
      instabilityRisk,
      systemicContinuityRisk,
      recoveryProbability,
      overviewDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicContinuityOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_continuity_overview_invalid" });
    return p.data;
  }

  @Get("instability-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async instabilityMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalEconomicContinuityNode.findMany({ where: { relationshipId }, take: 48 });
    const instabilityByTerritory: Record<string, number> = {};
    const instabilityBySector: Record<string, number> = {};
    for (const n of nodes.filter((x) => x.active)) {
      const tKey = n.territoryCountry;
      instabilityByTerritory[tKey] = Math.max(instabilityByTerritory[tKey] ?? 0, n.instabilityScore);
      const sKey = n.sectorSlug ?? "UNSECTORED";
      instabilityBySector[sKey] = Math.max(instabilityBySector[sKey] ?? 0, n.instabilityScore);
    }
    const unstableZones = nodes
      .filter((n) => n.active && n.instabilityScore >= 58)
      .map((n) => ({ continuityNodeId: n.id, continuityNodeCode: n.continuityNodeCode, score: n.instabilityScore }))
      .slice(0, 12);
    const overviewDiagnostics = await this.buildOverviewDiagnostics(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      instabilityByTerritory,
      instabilityBySector,
      unstableZones: this.withDisabledFlags(unstableZones),
      overviewDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicContinuityInstabilityMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_continuity_instability_map_invalid" });
    return p.data;
  }

  @Get("recovery-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async recoveryMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalEconomicContinuityNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalEconomicContinuityDependency.findMany({
      where: { sourceNode: { relationshipId } },
      take: 96,
    });
    const map = await this.recovery.buildRecoveryMap(relationshipId);
    const ctx = await this.corridorContext.load(relationshipId);
    const scores = this.stability.computeStability(ctx);
    const proj = this.recovery.computeRecoveryProjection(scores, map.recoveryDiagnostics);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      recoveryChains: map.recoveryChains,
      ...proj,
      recoveryDiagnostics: map.recoveryDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicContinuityRecoveryMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_continuity_recovery_map_invalid" });
    return p.data;
  }

  @Get("critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async criticalCorridors(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string,
  ) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(relationshipId)) {
      throw new BadRequestException({ code: "relational_economic_continuity_missing_relationship" });
    }
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const critical = await this.risk.listCriticalCorridors(organizationId);
    return {
      relationshipId,
      criticalCorridors: critical
        .filter((c) => c.relationshipId === relationshipId)
        .map((c) => ({
          continuityNodeId: c.id,
          continuityNodeCode: c.continuityNodeCode,
          score: c.systemicContinuityRisk,
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        })),
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
      throw new BadRequestException({ code: "relational_economic_continuity_missing_relationship" });
    }
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalEconomicContinuityNode.findMany({ where: { relationshipId }, take: 48 });
    const active = nodes.filter((n) => n.active);
    const signals = await this.pressure.listSignals(relationshipId);
    const raw = {
      relationshipId,
      continuityPressure:
        active.length === 0
          ? 0
          : this.policy.clampInt(active.reduce((s, n) => s + n.continuityPressure, 0) / active.length),
      systemicContinuityRisk:
        active.length === 0
          ? 0
          : this.policy.clampInt(active.reduce((s, n) => s + n.systemicContinuityRisk, 0) / active.length),
      economicSurvivalProbability:
        active.length === 0
          ? 0.05
          : this.policy.clampProb(active.reduce((s, n) => s + n.economicSurvivalProbability, 0) / active.length),
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
    const p = RelationalEconomicContinuitySystemicPressureSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_continuity_systemic_pressure_invalid" });
    return p.data;
  }

  @Get("resilience-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async resilienceHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const hist = await this.history.buildResilienceHistory(relationshipId);
    const raw = {
      relationshipId,
      ...hist,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicContinuityResilienceHistorySchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_continuity_resilience_history_invalid" });
    return p.data;
  }

  @Post("archive-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalEconomicContinuitySnapshot.findUnique({
      where: { id },
      include: { relationship: { select: { corridorState: true } } },
    });
    if (!snap) throw new NotFoundException({ code: "relational_economic_continuity_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    await this.governance.assertCorridorOperational(snap.relationshipId, "operational_observation");
    const mutationGate = this.policy.assertEconomicContinuityMutationAllowed(snap.relationship.corridorState);
    if (!mutationGate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_continuity_corridor_readonly",
        detail: mutationGate.diagnostics,
      });
    }
    await this.prisma.relationalEconomicContinuitySnapshot.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await this.prisma.relationalEconomicContinuityEvent.create({
      data: {
        relationshipId: snap.relationshipId,
        continuityNodeId: snap.continuityNodeId,
        eventType: RelationalEconomicContinuityEventType.SNAPSHOT_ARCHIVED,
        actorOrganizationId: organizationId,
        diagnostics: { snapshotId: id } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
    const raw = {
      ok: true as const,
      code: "relational_economic_continuity_snapshot_archived",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicContinuityActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_continuity_action_invalid" });
    return p.data;
  }
}
