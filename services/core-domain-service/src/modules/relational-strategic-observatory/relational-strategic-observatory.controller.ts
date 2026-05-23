/**
 * Instruction 20.39 — REST API for relational strategic intelligence (non-autopilot).
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
  RelationalStrategicObservatoryGrid,
  RelationalStrategicObservatoryNode,
  RelationalStrategicObservatorySignal,
} from "@prisma/client";
import {
  RelationalStrategicObservatoryActionResponseSchema,
  RelationalStrategicObservatoryOverviewSchema,
  RelationalStrategicObservatorySnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalStrategicObservatoryCorridorContextService } from "./relational-strategic-observatory-corridor-context.service";
import { RelationalStrategicObservatoryEngineService } from "./relational-strategic-observatory-engine.service";
import { RelationalStrategicObservatoryGuard } from "./relational-strategic-observatory.guard";
import { RelationalStrategicObservatoryIngestionService } from "./relational-strategic-observatory-ingestion.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";

@Controller("relational-strategic-observatory")
@UseGuards(VenextAuthzGuard, RelationalStrategicObservatoryGuard)
export class RelationalStrategicObservatoryController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalStrategicObservatoryPolicyService,
    private readonly corridorContext: RelationalStrategicObservatoryCorridorContextService,
    private readonly engine: RelationalStrategicObservatoryEngineService,
    private readonly ingestion: RelationalStrategicObservatoryIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_strategic_observatory_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_strategic_observatory_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_strategic_observatory_relationship_not_found" });
  }

  private nodeWire(n: RelationalStrategicObservatoryNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      observatoryType: n.observatoryType,
      observatoryPriority: n.observatoryPriority,
      observatoryStatus: n.observatoryStatus,
      severity: n.severity,
      observatoryScore: n.observatoryScore,
      systemicPressure: n.systemicPressure,
      resilienceStrength: n.resilienceStrength,
      executiveExposure: n.executiveExposure,
      strategicCoordinationPressure: n.strategicCoordinationPressure,
      strategicAlignmentScore: n.strategicAlignmentScore,
      governancePressure: n.governancePressure,
      arbitrationPressure: n.arbitrationPressure,
      stabilizationPressure: n.stabilizationPressure,
      monitoringPressure: n.monitoringPressure,
      orchestrationPressure: n.orchestrationPressure,
      institutionalPressure: n.institutionalPressure,
      intelligencePressure: n.intelligencePressure,
      commandPressure: n.commandPressure,
      operationsPressure: n.operationsPressure,
      controlRoomPressure: n.controlRoomPressure,
      synthesisPressure: n.synthesisPressure,
      recoveryPressure: n.recoveryPressure,
      sovereigntyPressure: n.sovereigntyPressure,
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

  private signalWire(s: RelationalStrategicObservatorySignal) {
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

  private gridWire(b: RelationalStrategicObservatoryGrid) {
    return {
      id: b.id,
      gridCode: b.gridCode,
      gridType: b.gridType,
      severity: b.severity,
      priority: b.priority,
      title: b.title,
      summary: b.summary,
      institutionalPressure: b.institutionalPressure,
      executiveExposure: b.executiveExposure,
      createdAt: b.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-observatory-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicObservatoryOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalStrategicObservatoryNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeStrategicObservatoryState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `STRAT_INTEL_NODE:${relationshipId}:preview`,
          observatoryType: state.observatoryType,
          observatoryPriority: state.observatoryPriority,
          observatoryStatus: state.observatoryStatus,
          severity: state.severity,
          observatoryScore: state.observatoryScore,
          systemicPressure: state.systemicPressure,
          resilienceStrength: state.resilienceStrength,
          executiveExposure: state.executiveExposure,
          strategicCoordinationPressure: state.strategicCoordinationPressure,
          strategicAlignmentScore: state.strategicAlignmentScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          orchestrationPressure: state.orchestrationPressure,
          institutionalPressure: state.institutionalPressure,
          intelligencePressure: state.intelligencePressure,
          commandPressure: state.commandPressure,
          operationsPressure: state.operationsPressure,
          controlRoomPressure: state.controlRoomPressure,
          synthesisPressure: state.synthesisPressure,
          recoveryPressure: state.recoveryPressure,
          sovereigntyPressure: state.sovereigntyPressure,
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
        grids: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          signalCount: 0,
          gridCount: 0,
          executiveExposureDetected: state.executiveInstabilityDetected,
          systemicConcentrationDetected: state.systemicConcentrationDetected,
          observatoryPriorityDetected: state.observatoryPriorityDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalStrategicObservatoryOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_strategic_observatory_overview_invalid" });
      return p.data;
    }
    const [signals, matrices] = await Promise.all([
      this.prisma.relationalStrategicObservatorySignal.findMany({ where: { strategicObservatoryNodeId: node.id } }),
      this.prisma.relationalStrategicObservatoryGrid.findMany({ where: { strategicObservatoryNodeId: node.id } }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      grids: matrices.map((b) => this.gridWire(b)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: signals.length,
        gridCount: matrices.length,
        executiveExposureDetected: node.executiveExposure >= 70,
        systemicConcentrationDetected: node.systemicPressure >= 68,
        observatoryPriorityDetected: node.executiveUrgency >= 55,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalStrategicObservatoryOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_strategic_observatory_overview_invalid" });
    return p.data;
  }

  @Get("strategic-observatory-grids/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicObservatoryGrids(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const matrices = await this.prisma.relationalStrategicObservatoryGrid.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      grids: matrices.map((b) => this.gridWire(b)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-observatory-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicObservatorySystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalStrategicObservatoryNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executiveExposure, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      meanSystemicPressure: meanExposure,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-observatory-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicObservatoryCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalStrategicObservatoryNode.findMany({
      where: {
        active: true,
        executiveUrgency: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { executiveExposure: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        nodeCode: n.nodeCode,
        executiveUrgency: n.executiveUrgency,
        executiveExposure: n.executiveExposure,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-observatory-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicObservatoryPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalStrategicObservatoryNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { systemicPressure: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: nodes.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        executiveUrgency: n.executiveUrgency,
        observatoryScore: n.observatoryScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-observatory-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicObservatoryBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalStrategicObservatoryNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    const meanBalance =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.strategicAlignmentScore, 0) / nodes.length)
        : 0;
    const meanPressure =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executiveExposure, 0) / nodes.length)
        : 0;
    const meanConcentration =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicPressure, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      strategicAlignmentScore: meanBalance,
      executiveExposure: meanPressure,
      systemicPressure: meanConcentration,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-observatory-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicObservatoryHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalStrategicObservatorySnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalStrategicObservatorySnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          observatoryStatus: s.observatoryStatus,
          observatoryScore: s.observatoryScore,
          systemicPressure: s.systemicPressure,
          resilienceStrength: s.resilienceStrength,
          executiveExposure: s.executiveExposure,
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

  @Post("archive-strategic-observatory-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveStrategicObservatorySnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalStrategicObservatorySnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_strategic_observatory_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_strategic_observatory_relationship_not_found" });
    const gate = this.policy.assertStrategicObservatoryMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_strategic_observatory_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveStrategicObservatorySnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalStrategicObservatoryActionResponseSchema.safeParse({
      ok: true,
      code: "relational_strategic_observatory_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_strategic_observatory_action_invalid" });
    return p.data;
  }
}
