/**
 * Instruction 20.32 — REST API for relational economic stabilization (non-autopilot).
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
  RelationalEconomicStabilizationDependency,
  RelationalEconomicStabilizationNode,
  RelationalEconomicStabilizationSignal,
} from "@prisma/client";
import {
  RelationalEconomicStabilizationActionResponseSchema,
  RelationalEconomicStabilizationOverviewSchema,
  RelationalEconomicStabilizationSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicStabilizationCorridorContextService } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationDependencyService } from "./relational-economic-stabilization-dependency.service";
import { RelationalEconomicStabilizationEngineService } from "./relational-economic-stabilization-engine.service";
import { RelationalEconomicStabilizationGuard } from "./relational-economic-stabilization.guard";
import { RelationalEconomicStabilizationIngestionService } from "./relational-economic-stabilization-ingestion.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";
import { RelationalEconomicStabilizationResilienceService } from "./relational-economic-stabilization-resilience.service";

@Controller("relational-economic-stabilization")
@UseGuards(VenextAuthzGuard, RelationalEconomicStabilizationGuard)
export class RelationalEconomicStabilizationController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicStabilizationPolicyService,
    private readonly corridorContext: RelationalEconomicStabilizationCorridorContextService,
    private readonly engine: RelationalEconomicStabilizationEngineService,
    private readonly dependencySvc: RelationalEconomicStabilizationDependencyService,
    private readonly resilienceSvc: RelationalEconomicStabilizationResilienceService,
    private readonly ingestion: RelationalEconomicStabilizationIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_stabilization_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_stabilization_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_economic_stabilization_relationship_not_found" });
  }

  private nodeWire(n: RelationalEconomicStabilizationNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      stabilizationType: n.stabilizationType,
      stabilizationPriority: n.stabilizationPriority,
      stabilizationStatus: n.stabilizationStatus,
      severity: n.severity,
      stabilizationScore: n.stabilizationScore,
      instabilityPressure: n.instabilityPressure,
      resilienceLevel: n.resilienceLevel,
      systemicExposure: n.systemicExposure,
      dependencyPressure: n.dependencyPressure,
      continuityPressure: n.continuityPressure,
      sovereigntyPressure: n.sovereigntyPressure,
      arbitrationPressure: n.arbitrationPressure,
      governancePressure: n.governancePressure,
      recoveryPressure: n.recoveryPressure,
      coordinationStress: n.coordinationStress,
      stabilizationUrgency: n.stabilizationUrgency,
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

  private signalWire(s: RelationalEconomicStabilizationSignal) {
    return {
      id: s.id,
      signalCode: s.signalCode,
      signalType: s.signalType,
      intensity: s.intensity,
      pressureLevel: s.pressureLevel,
      exposureLevel: s.exposureLevel,
      createdAt: s.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private depWire(d: RelationalEconomicStabilizationDependency) {
    return {
      id: d.id,
      dependencyCode: d.dependencyCode,
      dependencyWeight: d.dependencyWeight,
      crossCorridorExposure: d.crossCorridorExposure,
      propagationStress: d.propagationStress,
      concentrationScore: d.concentrationScore,
      createdAt: d.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("stabilization-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilizationOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalEconomicStabilizationNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeStabilizationState(ctx);
      const traversal = await this.dependencySvc.traversePeerCorridors(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `STAB_NODE:${relationshipId}:preview`,
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
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        },
        signals: [],
        dependencies: this.dependencySvc.detectCriticalDependencies(ctx).map((d, i) => ({
          id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
          ...d,
          createdAt: new Date().toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        })),
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          traversalDepth: traversal.traversalDepth,
          visitedCorridors: traversal.visitedCorridors,
          boundedTraversalApplied: traversal.boundedTraversalApplied,
          signalCount: 0,
          dependencyCount: this.dependencySvc.detectCriticalDependencies(ctx).length,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalEconomicStabilizationOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_economic_stabilization_overview_invalid" });
      return p.data;
    }
    const [signals, dependencies] = await Promise.all([
      this.prisma.relationalEconomicStabilizationSignal.findMany({ where: { stabilizationNodeId: node.id } }),
      this.prisma.relationalEconomicStabilizationDependency.findMany({
        where: { sourceStabilizationNodeId: node.id },
      }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      dependencies: dependencies.map((d) => this.depWire(d)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        traversalDepth: 0,
        visitedCorridors: 1,
        boundedTraversalApplied: false,
        signalCount: signals.length,
        dependencyCount: dependencies.length,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicStabilizationOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_stabilization_overview_invalid" });
    return p.data;
  }

  @Get("stabilization-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilizationMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const ctx = await this.corridorContext.load(relationshipId);
    const state = this.engine.computeStabilizationState(ctx);
    return {
      relationshipId,
      stabilizationScore: state.stabilizationScore,
      instabilityPressure: state.instabilityPressure,
      resilienceLevel: state.resilienceLevel,
      systemicExposure: state.systemicExposure,
      stabilizationUrgency: state.stabilizationUrgency,
      peerRelationshipCount: ctx.peerRelationshipCount,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("stabilization-dependencies/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilizationDependencies(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const deps = await this.prisma.relationalEconomicStabilizationDependency.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      dependencies: deps.map((d) => this.depWire(d)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("stabilization-resilience/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilizationResilience(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const ctx = await this.corridorContext.load(relationshipId);
    const projection = this.resilienceSvc.projectResilience(ctx);
    return {
      relationshipId,
      ...projection,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("stabilization-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilizationCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalEconomicStabilizationNode.findMany({
      where: {
        active: true,
        instabilityPressure: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ instabilityPressure: "desc" }, { stabilizationUrgency: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        nodeCode: n.nodeCode,
        instabilityPressure: n.instabilityPressure,
        resilienceLevel: n.resilienceLevel,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("stabilization-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilizationSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalEconomicStabilizationNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    const meanSystemicExposure =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicExposure, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      meanSystemicExposure,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("stabilization-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async stabilizationHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalEconomicStabilizationSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) => {
        const wire = {
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          stabilizationStatus: s.stabilizationStatus,
          stabilizationScore: s.stabilizationScore,
          instabilityPressure: s.instabilityPressure,
          resilienceLevel: s.resilienceLevel,
          systemicExposure: s.systemicExposure,
          createdAt: s.createdAt.toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        };
        return RelationalEconomicStabilizationSnapshotSchema.parse(wire);
      }),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Post("archive-stabilization-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveStabilizationSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalEconomicStabilizationSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_economic_stabilization_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_economic_stabilization_relationship_not_found" });
    const gate = this.policy.assertEconomicStabilizationMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_stabilization_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveStabilizationSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalEconomicStabilizationActionResponseSchema.safeParse({
      ok: true,
      code: "relational_economic_stabilization_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_economic_stabilization_action_invalid" });
    return p.data;
  }
}
