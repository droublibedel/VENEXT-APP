/**
 * Instruction 20.34 — REST API for relational executive orchestration (non-autopilot).
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
  RelationalExecutiveOrchestrationDependency,
  RelationalExecutiveOrchestrationNode,
  RelationalExecutiveOrchestrationSignal,
} from "@prisma/client";
import {
  RelationalExecutiveOrchestrationActionResponseSchema,
  RelationalExecutiveOrchestrationOverviewSchema,
  RelationalExecutiveOrchestrationSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalExecutiveOrchestrationCorridorContextService } from "./relational-executive-orchestration-corridor-context.service";
import { RelationalExecutiveOrchestrationEngineService } from "./relational-executive-orchestration-engine.service";
import { RelationalExecutiveOrchestrationGuard } from "./relational-executive-orchestration.guard";
import { RelationalExecutiveOrchestrationIngestionService } from "./relational-executive-orchestration-ingestion.service";
import { RelationalExecutiveOrchestrationPolicyService } from "./relational-executive-orchestration-policy.service";

@Controller("relational-executive-orchestration")
@UseGuards(VenextAuthzGuard, RelationalExecutiveOrchestrationGuard)
export class RelationalExecutiveOrchestrationController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalExecutiveOrchestrationPolicyService,
    private readonly corridorContext: RelationalExecutiveOrchestrationCorridorContextService,
    private readonly engine: RelationalExecutiveOrchestrationEngineService,
    private readonly ingestion: RelationalExecutiveOrchestrationIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_executive_orchestration_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_executive_orchestration_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_executive_orchestration_relationship_not_found" });
  }

  private nodeWire(n: RelationalExecutiveOrchestrationNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      orchestrationType: n.orchestrationType,
      orchestrationPriority: n.orchestrationPriority,
      orchestrationStatus: n.orchestrationStatus,
      severity: n.severity,
      orchestrationScore: n.orchestrationScore,
      executiveCoordinationPressure: n.executiveCoordinationPressure,
      systemicExposure: n.systemicExposure,
      executiveResilience: n.executiveResilience,
      strategicAlignmentScore: n.strategicAlignmentScore,
      governancePressure: n.governancePressure,
      arbitrationPressure: n.arbitrationPressure,
      stabilizationPressure: n.stabilizationPressure,
      monitoringPressure: n.monitoringPressure,
      recoveryPressure: n.recoveryPressure,
      sovereigntyPressure: n.sovereigntyPressure,
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

  private signalWire(s: RelationalExecutiveOrchestrationSignal) {
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

  private dependencyWire(d: RelationalExecutiveOrchestrationDependency) {
    return {
      id: d.id,
      dependencyCode: d.dependencyCode,
      dependencyWeight: d.dependencyWeight,
      crossCorridorExposure: d.crossCorridorExposure,
      coordinationStress: d.coordinationStress,
      concentrationScore: d.concentrationScore,
      createdAt: d.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-orchestration-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOrchestrationOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalExecutiveOrchestrationNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeExecutiveOrchestrationState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `EXEC_ORCH_NODE:${relationshipId}:preview`,
          orchestrationType: state.orchestrationType,
          orchestrationPriority: state.orchestrationPriority,
          orchestrationStatus: state.orchestrationStatus,
          severity: state.severity,
          orchestrationScore: state.orchestrationScore,
          executiveCoordinationPressure: state.executiveCoordinationPressure,
          systemicExposure: state.systemicExposure,
          executiveResilience: state.executiveResilience,
          strategicAlignmentScore: state.strategicAlignmentScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
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
        dependencies: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          signalCount: 0,
          dependencyCount: 0,
          executiveInstabilityDetected: state.executiveInstabilityDetected,
          coordinationBreakdownDetected: state.coordinationBreakdownDetected,
          systemicConcentrationDetected: state.systemicConcentrationDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalExecutiveOrchestrationOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_executive_orchestration_overview_invalid" });
      return p.data;
    }
    const [signals, dependencies] = await Promise.all([
      this.prisma.relationalExecutiveOrchestrationSignal.findMany({ where: { orchestrationNodeId: node.id } }),
      this.prisma.relationalExecutiveOrchestrationDependency.findMany({ where: { sourceNodeId: node.id } }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      dependencies: dependencies.map((d) => this.dependencyWire(d)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: signals.length,
        dependencyCount: dependencies.length,
        executiveInstabilityDetected: node.executiveCoordinationPressure >= 68,
        coordinationBreakdownDetected: node.executiveCoordinationPressure >= 62,
        systemicConcentrationDetected: node.systemicExposure >= 70,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalExecutiveOrchestrationOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_executive_orchestration_overview_invalid" });
    return p.data;
  }

  @Get("executive-orchestration-dependencies/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOrchestrationDependencies(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const deps = await this.prisma.relationalExecutiveOrchestrationDependency.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      dependencies: deps.map((d) => this.dependencyWire(d)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-orchestration-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOrchestrationSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveOrchestrationNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    const meanExposure =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicExposure, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      meanSystemicExposure: meanExposure,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-orchestration-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOrchestrationCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalExecutiveOrchestrationNode.findMany({
      where: {
        active: true,
        executiveUrgency: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { systemicExposure: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        nodeCode: n.nodeCode,
        executiveUrgency: n.executiveUrgency,
        systemicExposure: n.systemicExposure,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-orchestration-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOrchestrationPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveOrchestrationNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { executiveCoordinationPressure: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: nodes.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        executiveUrgency: n.executiveUrgency,
        orchestrationScore: n.orchestrationScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-orchestration-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOrchestrationBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveOrchestrationNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    const meanScore =
      nodes.length > 0 ? this.policy.clampInt(nodes.reduce((a, n) => a + n.orchestrationScore, 0) / nodes.length) : 0;
    const meanResilience =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executiveResilience, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      balanceScore: meanScore,
      executiveResilience: meanResilience,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-orchestration-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOrchestrationHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalExecutiveOrchestrationSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalExecutiveOrchestrationSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          orchestrationStatus: s.orchestrationStatus,
          orchestrationScore: s.orchestrationScore,
          executiveCoordinationPressure: s.executiveCoordinationPressure,
          systemicExposure: s.systemicExposure,
          executiveResilience: s.executiveResilience,
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

  @Post("archive-executive-orchestration-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveExecutiveOrchestrationSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalExecutiveOrchestrationSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_executive_orchestration_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_executive_orchestration_relationship_not_found" });
    const gate = this.policy.assertExecutiveOrchestrationMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_executive_orchestration_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveExecutiveOrchestrationSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalExecutiveOrchestrationActionResponseSchema.safeParse({
      ok: true,
      code: "relational_executive_orchestration_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_executive_orchestration_action_invalid" });
    return p.data;
  }
}
