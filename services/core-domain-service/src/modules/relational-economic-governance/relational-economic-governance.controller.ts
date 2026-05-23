/**
 * Instruction 20.30 — REST API for relational economic governance intelligence (non-autopilot).
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
import type {
  RelationalEconomicGovernanceConflict,
  RelationalEconomicGovernanceCoordination,
  RelationalEconomicGovernanceNode,
} from "@prisma/client";
import {
  RelationalEconomicGovernanceActionResponseSchema,
  RelationalEconomicGovernanceBalanceSchema,
  RelationalEconomicGovernanceNodeSchema,
  RelationalEconomicGovernancePrioritiesResponseSchema,
  RelationalEconomicGovernanceSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicGovernanceBalanceService } from "./relational-economic-governance-balance.service";
import { RelationalEconomicGovernanceCoordinationService } from "./relational-economic-governance-coordination.service";
import { RelationalEconomicGovernanceCorridorContextService } from "./relational-economic-governance-corridor-context.service";
import { RelationalEconomicGovernanceGuard } from "./relational-economic-governance.guard";
import { RelationalEconomicGovernanceIngestionService } from "./relational-economic-governance-ingestion.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";
import { RelationalEconomicGovernancePriorityService } from "./relational-economic-governance-priority.service";

@Controller("relational-economic-governance")
@UseGuards(VenextAuthzGuard, RelationalEconomicGovernanceGuard)
export class RelationalEconomicGovernanceController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicGovernancePolicyService,
    private readonly corridorContext: RelationalEconomicGovernanceCorridorContextService,
    private readonly coordination: RelationalEconomicGovernanceCoordinationService,
    private readonly priority: RelationalEconomicGovernancePriorityService,
    private readonly balance: RelationalEconomicGovernanceBalanceService,
    private readonly ingestion: RelationalEconomicGovernanceIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_governance_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_governance_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_economic_governance_relationship_not_found" });
  }

  private async buildOverviewDiagnostics(relationshipId: string) {
    const ctx = await this.corridorContext.load(relationshipId);
    const state = await this.coordination.computeGovernanceState(ctx);
    const conflictCount = await this.prisma.relationalEconomicGovernanceConflict.count({
      where: { relationshipId },
    });
    return {
      heuristicFallbackUsed: ctx.heuristicFallbackUsed,
      fallbackReasons: ctx.fallbackReasons,
      recoveryPlansUsed: ctx.activeRecoveryPlanId ? 1 : 0,
      sovereigntyNodesUsed: ctx.primarySovereigntyNodeId ? 1 : 0,
      conflictCount,
      coordinationTraversal: {
        traversalDepth: state.coordination.traversalDepth,
        visitedCorridors: state.coordination.visitedCorridors,
        boundedTraversalApplied: state.coordination.boundedTraversalApplied,
        propagationEdgeCount: state.coordination.propagationEdgeCount,
      },
    };
  }

  private nodeWire(n: RelationalEconomicGovernanceNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      governanceNodeCode: n.governanceNodeCode,
      governanceType: n.governanceType,
      governancePriority: n.governancePriority,
      governanceStatus: n.governanceStatus,
      severity: n.severity,
      governanceScore: n.governanceScore,
      coordinationScore: n.coordinationScore,
      systemicRisk: n.systemicRisk,
      corridorCriticality: n.corridorCriticality,
      recoveryPressure: n.recoveryPressure,
      dependencyPressure: n.dependencyPressure,
      propagationPressure: n.propagationPressure,
      sovereigntyPressure: n.sovereigntyPressure,
      continuityPressure: n.continuityPressure,
      governanceStability: n.governanceStability,
      interventionUrgency: n.interventionUrgency,
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

  private coordWire(c: RelationalEconomicGovernanceCoordination) {
    const refs = Array.isArray(c.strategicCorridorRefs)
      ? (c.strategicCorridorRefs as string[])
      : [];
    return {
      id: c.id,
      coordinationCode: c.coordinationCode,
      coordinationScore: c.coordinationScore,
      strategicCorridorCount: c.strategicCorridorCount,
      coordinationOverload: c.coordinationOverload,
      balanceScore: c.balanceScore,
      governancePriorityScore: c.governancePriorityScore,
      strategicCorridorRefs: refs,
      createdAt: c.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private conflictWire(c: RelationalEconomicGovernanceConflict) {
    const affected = Array.isArray(c.affectedCorridors) ? (c.affectedCorridors as string[]) : [];
    return {
      id: c.id,
      conflictCode: c.conflictCode,
      conflictType: c.conflictType,
      severity: c.severity,
      priority: c.priority,
      affectedCorridors: affected,
      conflictPressure: c.conflictPressure,
      systemicExposure: c.systemicExposure,
      recoveryImpact: c.recoveryImpact,
      estimatedResolutionComplexity: c.estimatedResolutionComplexity,
      createdAt: c.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("governance-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async governanceOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalEconomicGovernanceNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    const coordinations = node
      ? await this.prisma.relationalEconomicGovernanceCoordination.findMany({
          where: { governanceNodeId: node.id },
        })
      : [];
    const conflicts = node
      ? await this.prisma.relationalEconomicGovernanceConflict.findMany({
          where: { governanceNodeId: node.id },
        })
      : [];
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = await this.coordination.computeGovernanceState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          governanceNodeCode: `GOVERNANCE_NODE:${relationshipId}:preview`,
          governanceType: state.governanceType,
          governancePriority: state.governancePriority,
          governanceStatus: state.governanceStatus,
          severity: state.severity,
          governanceScore: state.governanceScore,
          coordinationScore: state.coordinationScore,
          systemicRisk: state.systemicRisk,
          corridorCriticality: state.corridorCriticality,
          recoveryPressure: state.recoveryPressure,
          dependencyPressure: state.dependencyPressure,
          propagationPressure: state.propagationPressure,
          sovereigntyPressure: state.sovereigntyPressure,
          continuityPressure: state.continuityPressure,
          governanceStability: state.governanceStability,
          interventionUrgency: state.interventionUrgency,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        },
        coordinations: [],
        conflicts: [],
        overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalEconomicGovernanceNodeSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_economic_governance_overview_invalid" });
      return p.data;
    }
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      coordinations: coordinations.map((c) => this.coordWire(c)),
      conflicts: conflicts.map((c) => this.conflictWire(c)),
      overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicGovernanceNodeSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_governance_overview_invalid" });
    return p.data;
  }

  @Get("governance-conflicts/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async governanceConflicts(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const conflicts = await this.prisma.relationalEconomicGovernanceConflict.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      conflicts: conflicts.map((c) => this.conflictWire(c)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("governance-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async governancePriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalEconomicGovernanceNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ interventionUrgency: "desc" }, { systemicRisk: "desc" }],
      take: 48,
    });
    const raw = {
      organizationId,
      priorities: nodes.map((n) => ({
        relationshipId: n.relationshipId,
        governancePriorityScore: n.interventionUrgency,
        interventionUrgency: n.interventionUrgency,
        corridorCriticality: n.corridorCriticality,
        governanceScore: n.governanceScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicGovernancePrioritiesResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_governance_priorities_invalid" });
    return p.data;
  }

  @Get("governance-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async governanceBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalEconomicGovernanceNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    let balanceScore = 50;
    let coordinationPressure = 0;
    let territorialImbalance = 0;
    let sectorOverload = 0;
    const corridorWeights: Array<{
      relationshipId: string;
      corridorWeight: number;
      strategicImportance: number;
      paymentExecutionDisabled: true;
      publicTrackingDisabled: true;
    }> = [];
    for (const n of nodes) {
      const ctx = await this.corridorContext.load(n.relationshipId);
      const b = this.balance.computeBalance(ctx);
      balanceScore = this.policy.clampInt((balanceScore + b.balanceScore) / 2);
      coordinationPressure = Math.max(coordinationPressure, b.coordinationPressure);
      territorialImbalance = Math.max(territorialImbalance, b.territorialImbalance);
      sectorOverload = Math.max(sectorOverload, b.sectorOverload);
      corridorWeights.push({
        relationshipId: n.relationshipId,
        corridorWeight: b.corridorWeight,
        strategicImportance: b.strategicImportance,
        paymentExecutionDisabled: true,
        publicTrackingDisabled: true,
      });
    }
    const raw = {
      organizationId,
      balanceScore,
      coordinationPressure,
      territorialImbalance,
      sectorOverload,
      corridorWeights,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicGovernanceBalanceSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_governance_balance_invalid" });
    return p.data;
  }

  @Get("governance-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async governanceCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalEconomicGovernanceNode.findMany({
      where: {
        active: true,
        systemicRisk: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ systemicRisk: "desc" }, { interventionUrgency: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        governanceNodeCode: n.governanceNodeCode,
        score: n.systemicRisk,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("governance-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async governanceSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalEconomicGovernanceNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    const meanSystemicRisk =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicRisk, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      meanSystemicRisk,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("governance-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async governanceHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snaps = await this.prisma.relationalEconomicGovernanceSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    const parsed = snaps.map((s) => {
      const raw = {
        id: s.id,
        relationshipId: s.relationshipId,
        snapshotCode: s.snapshotCode,
        governanceStatus: s.governanceStatus,
        governanceScore: s.governanceScore,
        coordinationScore: s.coordinationScore,
        systemicRisk: s.systemicRisk,
        createdAt: s.createdAt.toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      return RelationalEconomicGovernanceSnapshotSchema.parse(raw);
    });
    return {
      relationshipId,
      snapshots: parsed,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Post("archive-governance-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveGovernanceSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalEconomicGovernanceSnapshot.findUnique({
      where: { id },
      include: { relationship: { select: { corridorState: true, id: true } } },
    });
    if (!snap) throw new NotFoundException({ code: "relational_economic_governance_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    await this.governance.assertCorridorOperational(snap.relationshipId, "operational_observation");
    const mutationGate = this.policy.assertEconomicGovernanceMutationAllowed(snap.relationship.corridorState);
    if (!mutationGate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_governance_corridor_readonly",
        detail: mutationGate.diagnostics,
      });
    }
    await this.ingestion.archiveGovernanceSnapshot(id, organizationId);
    const raw = {
      ok: true as const,
      code: "relational_economic_governance_snapshot_archived",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicGovernanceActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_governance_action_invalid" });
    return p.data;
  }
}
