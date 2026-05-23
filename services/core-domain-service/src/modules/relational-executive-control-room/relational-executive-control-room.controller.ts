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
  RelationalExecutiveControlRoomBoard,
  RelationalExecutiveControlRoomNode,
  RelationalExecutiveControlRoomSignal,
} from "@prisma/client";
import {
  RelationalExecutiveControlRoomActionResponseSchema,
  RelationalExecutiveControlRoomOverviewSchema,
  RelationalExecutiveControlRoomSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalExecutiveControlRoomCorridorContextService } from "./relational-executive-control-room-corridor-context.service";
import { RelationalExecutiveControlRoomEngineService } from "./relational-executive-control-room-engine.service";
import { RelationalExecutiveControlRoomGuard } from "./relational-executive-control-room.guard";
import { RelationalExecutiveControlRoomIngestionService } from "./relational-executive-control-room-ingestion.service";
import { RelationalExecutiveControlRoomPolicyService } from "./relational-executive-control-room-policy.service";

@Controller("relational-executive-control-room")
@UseGuards(VenextAuthzGuard, RelationalExecutiveControlRoomGuard)
export class RelationalExecutiveControlRoomController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalExecutiveControlRoomPolicyService,
    private readonly corridorContext: RelationalExecutiveControlRoomCorridorContextService,
    private readonly engine: RelationalExecutiveControlRoomEngineService,
    private readonly ingestion: RelationalExecutiveControlRoomIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_executive_control_room_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_executive_control_room_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_executive_control_room_relationship_not_found" });
  }

  private nodeWire(n: RelationalExecutiveControlRoomNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      controlRoomType: n.controlRoomType,
      boardPriority: n.boardPriority,
      controlRoomStatus: n.controlRoomStatus,
      severity: n.severity,
      controlRoomScore: n.controlRoomScore,
      systemicConcentration: n.systemicConcentration,
      resilienceStrength: n.resilienceStrength,
      executivePressure: n.executivePressure,
      strategicBalanceScore: n.strategicBalanceScore,
      governancePressure: n.governancePressure,
      arbitrationPressure: n.arbitrationPressure,
      stabilizationPressure: n.stabilizationPressure,
      monitoringPressure: n.monitoringPressure,
      orchestrationPressure: n.orchestrationPressure,
      institutionalPressure: n.institutionalPressure,
      intelligencePressure: n.intelligencePressure,
      commandPressure: n.commandPressure,
      operationsPressure: n.operationsPressure,
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

  private signalWire(s: RelationalExecutiveControlRoomSignal) {
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

  private boardWire(b: RelationalExecutiveControlRoomBoard) {
    return {
      id: b.id,
      boardCode: b.boardCode,
      boardType: b.boardType,
      severity: b.severity,
      priority: b.priority,
      title: b.title,
      summary: b.summary,
      institutionalPressure: b.institutionalPressure,
      executivePressure: b.executivePressure,
      createdAt: b.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-control-room-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveControlRoomOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalExecutiveControlRoomNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeExecutiveControlRoomState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `STRAT_INTEL_NODE:${relationshipId}:preview`,
          controlRoomType: state.controlRoomType,
          boardPriority: state.boardPriority,
          controlRoomStatus: state.controlRoomStatus,
          severity: state.severity,
          controlRoomScore: state.controlRoomScore,
          systemicConcentration: state.systemicConcentration,
          resilienceStrength: state.resilienceStrength,
          executivePressure: state.executivePressure,
          strategicBalanceScore: state.strategicBalanceScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          orchestrationPressure: state.orchestrationPressure,
          institutionalPressure: state.institutionalPressure,
          intelligencePressure: state.intelligencePressure,
          commandPressure: state.commandPressure,
          operationsPressure: state.operationsPressure,
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
        boards: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          signalCount: 0,
          boardCount: 0,
          executivePressureDetected: state.executiveEscalationDetected,
          systemicConcentrationDetected: state.strategicCoordinationFailureDetected,
          strategicPriorityDetected: state.strategicPriorityDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalExecutiveControlRoomOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_executive_control_room_overview_invalid" });
      return p.data;
    }
    const [signals, boards] = await Promise.all([
      this.prisma.relationalExecutiveControlRoomSignal.findMany({ where: { controlRoomNodeId: node.id } }),
      this.prisma.relationalExecutiveControlRoomBoard.findMany({ where: { controlRoomNodeId: node.id } }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      boards: boards.map((b) => this.boardWire(b)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: signals.length,
        boardCount: boards.length,
        executivePressureDetected: node.executivePressure >= 70,
        systemicConcentrationDetected: node.systemicConcentration >= 68,
        strategicPriorityDetected: node.executiveUrgency >= 55,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalExecutiveControlRoomOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_executive_control_room_overview_invalid" });
    return p.data;
  }

  @Get("executive-control-room-boards/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveControlRoomBoards(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const boards = await this.prisma.relationalExecutiveControlRoomBoard.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      boards: boards.map((b) => this.boardWire(b)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-control-room-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveControlRoomSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveControlRoomNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executivePressure, 0) / nodes.length)
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

  @Get("executive-control-room-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveControlRoomCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalExecutiveControlRoomNode.findMany({
      where: {
        active: true,
        executiveUrgency: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { executivePressure: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        nodeCode: n.nodeCode,
        executiveUrgency: n.executiveUrgency,
        executivePressure: n.executivePressure,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-control-room-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveControlRoomPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveControlRoomNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { systemicConcentration: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: nodes.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        executiveUrgency: n.executiveUrgency,
        controlRoomScore: n.controlRoomScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-control-room-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveControlRoomBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveControlRoomNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.strategicBalanceScore, 0) / nodes.length)
        : 0;
    const meanPressure =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executivePressure, 0) / nodes.length)
        : 0;
    const meanConcentration =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicConcentration, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      strategicBalanceScore: meanBalance,
      executivePressure: meanPressure,
      systemicConcentration: meanConcentration,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-control-room-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveControlRoomHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalExecutiveControlRoomSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalExecutiveControlRoomSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          controlRoomStatus: s.controlRoomStatus,
          controlRoomScore: s.controlRoomScore,
          systemicConcentration: s.systemicConcentration,
          resilienceStrength: s.resilienceStrength,
          executivePressure: s.executivePressure,
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

  @Post("archive-executive-control-room-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveExecutiveControlRoomSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalExecutiveControlRoomSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_executive_control_room_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_executive_control_room_relationship_not_found" });
    const gate = this.policy.assertExecutiveControlRoomMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_executive_control_room_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveExecutiveControlRoomSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalExecutiveControlRoomActionResponseSchema.safeParse({
      ok: true,
      code: "relational_executive_control_room_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_executive_control_room_action_invalid" });
    return p.data;
  }
}
