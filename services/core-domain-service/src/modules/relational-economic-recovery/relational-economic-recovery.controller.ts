/**
 * Instruction 20.29 — REST API for relational economic recovery planning (non-autopilot).
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
import type { Prisma, RelationalEconomicRecoveryPlan, RelationalEconomicRecoveryStep } from "@prisma/client";
import {
  RelationalEconomicRecoveryActionResponseSchema,
  RelationalEconomicRecoveryMapSchema,
  RelationalEconomicRecoveryPlanSchema,
  RelationalEconomicRecoverySnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicRecoveryCorridorContextService } from "./relational-economic-recovery-corridor-context.service";
import { RelationalEconomicRecoveryDependencyService } from "./relational-economic-recovery-dependency.service";
import { RelationalEconomicRecoveryGuard } from "./relational-economic-recovery.guard";
import { RelationalEconomicRecoveryIngestionService } from "./relational-economic-recovery-ingestion.service";
import { RelationalEconomicRecoveryPlanningService } from "./relational-economic-recovery-planning.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";
import { RelationalEconomicRecoveryPriorityService } from "./relational-economic-recovery-priority.service";

@Controller("relational-economic-recovery")
@UseGuards(VenextAuthzGuard, RelationalEconomicRecoveryGuard)
export class RelationalEconomicRecoveryController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicRecoveryPolicyService,
    private readonly corridorContext: RelationalEconomicRecoveryCorridorContextService,
    private readonly planning: RelationalEconomicRecoveryPlanningService,
    private readonly priority: RelationalEconomicRecoveryPriorityService,
    private readonly dependency: RelationalEconomicRecoveryDependencyService,
    private readonly ingestion: RelationalEconomicRecoveryIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_recovery_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_recovery_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_economic_recovery_relationship_not_found" });
  }

  private async buildOverviewDiagnostics(relationshipId: string) {
    const [ctx, traversal] = await Promise.all([
      this.corridorContext.load(relationshipId),
      this.dependency.buildRecoveryDependencyMap(relationshipId),
    ]);
    return {
      heuristicFallbackUsed: ctx.heuristicFallbackUsed,
      fallbackReasons: ctx.fallbackReasons,
      sovereigntyNodesUsed: ctx.primarySovereigntyNodeId ? 1 : 0,
      continuitySnapshotsUsed: ctx.continuityDependencyCount,
      macroDependenciesUsed: ctx.macroDependencyCount,
      supplyFlowEdgesUsed: ctx.supplyFlowEdgeCount,
      recoveryTraversal: {
        traversalDepth: traversal.traversalDepth,
        visitedNodes: traversal.visitedNodes,
        recoveryEdgeCount: traversal.recoveryEdgeCount,
        boundedTraversalApplied: traversal.boundedTraversalApplied,
        recoveryComplexity: this.policy.clampInt(traversal.recoveryChains.length * 3),
      },
    };
  }

  private planWire(p: RelationalEconomicRecoveryPlan) {
    return {
      id: p.id,
      relationshipId: p.relationshipId,
      planCode: p.planCode,
      recoveryType: p.recoveryType,
      recoveryPriority: p.recoveryPriority,
      recoveryStatus: p.recoveryStatus,
      severity: p.severity,
      recoveryScore: p.recoveryScore,
      instabilityScore: p.instabilityScore,
      dependencyExposure: p.dependencyExposure,
      continuityPressure: p.continuityPressure,
      sovereigntyPressure: p.sovereigntyPressure,
      corridorRecoveryProbability: p.corridorRecoveryProbability,
      estimatedRecoveryDuration: p.estimatedRecoveryDuration,
      recoveryComplexity: p.recoveryComplexity,
      interventionPriority: p.interventionPriority,
      systemicImpactRisk: p.systemicImpactRisk,
      territoryCountry: p.territoryCountry,
      territoryCity: p.territoryCity,
      sectorSlug: p.sectorSlug,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private stepWire(s: RelationalEconomicRecoveryStep) {
    return {
      id: s.id,
      stepCode: s.stepCode,
      stepOrder: s.stepOrder,
      stepType: s.stepType,
      blocking: s.blocking,
      estimatedDuration: s.estimatedDuration,
      dependencyLevel: s.dependencyLevel,
      recoveryImpactScore: s.recoveryImpactScore,
      recoveryRiskScore: s.recoveryRiskScore,
      confidenceLevel: s.confidenceLevel as "LOW" | "MEDIUM" | "HIGH",
      createdAt: s.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("recovery-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async recoveryOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const plan = await this.prisma.relationalEconomicRecoveryPlan.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    const steps = plan
      ? await this.prisma.relationalEconomicRecoveryStep.findMany({
          where: { recoveryPlanId: plan.id },
          orderBy: { stepOrder: "asc" },
        })
      : [];
    if (!plan) {
      const ctx = await this.corridorContext.load(relationshipId);
      const generated = await this.planning.generateRecoveryPlan(ctx);
      const raw = {
        relationshipId,
        plan: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          planCode: `RECOVERY_PLAN:${relationshipId}:preview`,
          recoveryType: generated.recoveryType,
          recoveryPriority: generated.recoveryPriority,
          recoveryStatus: generated.recoveryStatus,
          severity: generated.severity,
          recoveryScore: generated.recoveryScore,
          instabilityScore: generated.instabilityScore,
          dependencyExposure: generated.dependencyExposure,
          continuityPressure: generated.continuityPressure,
          sovereigntyPressure: generated.sovereigntyPressure,
          corridorRecoveryProbability: generated.corridorRecoveryProbability,
          estimatedRecoveryDuration: generated.estimatedRecoveryDuration,
          recoveryComplexity: generated.recoveryComplexity,
          interventionPriority: generated.interventionPriority,
          systemicImpactRisk: generated.systemicImpactRisk,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        },
        steps: generated.steps.map((s, i) => ({
          id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
          ...s,
          createdAt: new Date().toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        })),
        overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalEconomicRecoveryPlanSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_economic_recovery_overview_invalid" });
      return p.data;
    }
    const raw = {
      relationshipId,
      plan: this.planWire(plan),
      steps: steps.map((s) => this.stepWire(s)),
      overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicRecoveryPlanSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_recovery_overview_invalid" });
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
    const ctx = await this.corridorContext.load(relationshipId);
    const priority = this.priority.computePriority(ctx);
    const plans = await this.prisma.relationalEconomicRecoveryPlan.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    const steps = await this.prisma.relationalEconomicRecoveryStep.findMany({
      where: { recoveryPlan: { relationshipId } },
      orderBy: { stepOrder: "asc" },
      take: 120,
    });
    const raw = {
      relationshipId,
      plans: plans.map((p) => this.planWire(p)),
      steps: steps.map((s) => this.stepWire(s)),
      recoveryPriorityScore: priority.recoveryPriorityScore,
      interventionUrgency: priority.interventionUrgency,
      overviewDiagnostics: await this.buildOverviewDiagnostics(relationshipId),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicRecoveryMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_recovery_map_invalid" });
    return p.data;
  }

  @Get("recovery-dependencies/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async recoveryDependencies(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const traversal = await this.dependency.buildRecoveryDependencyMap(relationshipId);
    return {
      relationshipId,
      recoveryChains: traversal.recoveryChains,
      recoveryBottlenecks: traversal.recoveryBottlenecks,
      recoveryBlockers: traversal.recoveryBlockers,
      diagnostics: traversal,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("recovery-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async recoveryPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const plans = await this.prisma.relationalEconomicRecoveryPlan.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ interventionPriority: "desc" }, { instabilityScore: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: plans.map((p) => ({
        relationshipId: p.relationshipId,
        planId: p.id,
        planCode: p.planCode,
        recoveryPriorityScore: p.interventionPriority,
        interventionUrgency: p.interventionPriority,
        corridorCriticality: p.instabilityScore,
        recoveryWindowRisk: p.systemicImpactRisk,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("recovery-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async recoveryHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snaps = await this.prisma.relationalEconomicRecoverySnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    const parsed = snaps.map((s) => {
      const raw = {
        id: s.id,
        relationshipId: s.relationshipId,
        snapshotCode: s.snapshotCode,
        recoveryStatus: s.recoveryStatus,
        recoveryScore: s.recoveryScore,
        instabilityScore: s.instabilityScore,
        corridorRecoveryProbability: s.corridorRecoveryProbability,
        createdAt: s.createdAt.toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      return RelationalEconomicRecoverySnapshotSchema.parse(raw);
    });
    return {
      relationshipId,
      snapshots: parsed,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("critical-recovery-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async criticalRecoveryCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalEconomicRecoveryPlan.findMany({
      where: {
        active: true,
        instabilityScore: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ instabilityScore: "desc" }, { interventionPriority: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((p) => ({
        relationshipId: p.relationshipId,
        planId: p.id,
        planCode: p.planCode,
        score: p.instabilityScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Post("archive-recovery-plan/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveRecoveryPlan(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    const plan = await this.prisma.relationalEconomicRecoveryPlan.findUnique({
      where: { id },
      include: { relationship: { select: { corridorState: true, id: true } } },
    });
    if (!plan) throw new NotFoundException({ code: "relational_economic_recovery_plan_not_found" });
    await this.assertOrgOnRelationship(organizationId, plan.relationshipId);
    await this.governance.assertCorridorOperational(plan.relationshipId, "operational_observation");
    const mutationGate = this.policy.assertEconomicRecoveryMutationAllowed(plan.relationship.corridorState);
    if (!mutationGate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_recovery_corridor_readonly",
        detail: mutationGate.diagnostics,
      });
    }
    await this.ingestion.archiveRecoveryPlan(id, organizationId);
    const raw = {
      ok: true as const,
      code: "relational_economic_recovery_plan_archived",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicRecoveryActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_recovery_action_invalid" });
    return p.data;
  }
}
