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
  RelationalGlobalExecutiveSupervisionMatrix,
  RelationalGlobalExecutiveSupervisionNode,
  RelationalGlobalExecutiveSupervisionSignal,
} from "@prisma/client";
import {
  RelationalGlobalExecutiveSupervisionActionResponseSchema,
  RelationalGlobalExecutiveSupervisionOverviewSchema,
  RelationalGlobalExecutiveSupervisionSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalGlobalExecutiveSupervisionCorridorContextService } from "./relational-global-executive-supervision-corridor-context.service";
import { RelationalGlobalExecutiveSupervisionEngineService } from "./relational-global-executive-supervision-engine.service";
import { RelationalGlobalExecutiveSupervisionGuard } from "./relational-global-executive-supervision.guard";
import { RelationalGlobalExecutiveSupervisionIngestionService } from "./relational-global-executive-supervision-ingestion.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";

@Controller("relational-global-executive-supervision")
@UseGuards(VenextAuthzGuard, RelationalGlobalExecutiveSupervisionGuard)
export class RelationalGlobalExecutiveSupervisionController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalGlobalExecutiveSupervisionPolicyService,
    private readonly corridorContext: RelationalGlobalExecutiveSupervisionCorridorContextService,
    private readonly engine: RelationalGlobalExecutiveSupervisionEngineService,
    private readonly ingestion: RelationalGlobalExecutiveSupervisionIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_global_executive_supervision_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_global_executive_supervision_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_global_executive_supervision_relationship_not_found" });
  }

  private nodeWire(n: RelationalGlobalExecutiveSupervisionNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      supervisionType: n.supervisionType,
      supervisionPriority: n.supervisionPriority,
      supervisionStatus: n.supervisionStatus,
      severity: n.severity,
      supervisionScore: n.supervisionScore,
      systemicExposure: n.systemicExposure,
      resilienceStrength: n.resilienceStrength,
      executivePressure: n.executivePressure,
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

  private signalWire(s: RelationalGlobalExecutiveSupervisionSignal) {
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

  private matrixWire(b: RelationalGlobalExecutiveSupervisionMatrix) {
    return {
      id: b.id,
      matrixCode: b.matrixCode,
      matrixType: b.matrixType,
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

  @Get("global-executive-supervision-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async globalExecutiveSupervisionOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalGlobalExecutiveSupervisionNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeGlobalExecutiveSupervisionState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `STRAT_INTEL_NODE:${relationshipId}:preview`,
          supervisionType: state.supervisionType,
          supervisionPriority: state.supervisionPriority,
          supervisionStatus: state.supervisionStatus,
          severity: state.severity,
          supervisionScore: state.supervisionScore,
          systemicExposure: state.systemicExposure,
          resilienceStrength: state.resilienceStrength,
          executivePressure: state.executivePressure,
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
        matrices: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          signalCount: 0,
          matrixCount: 0,
          executivePressureDetected: state.executiveEscalationDetected,
          systemicExposureDetected: state.systemicConcentrationDetected,
          supervisionPriorityDetected: state.supervisionPriorityDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalGlobalExecutiveSupervisionOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_global_executive_supervision_overview_invalid" });
      return p.data;
    }
    const [signals, matrices] = await Promise.all([
      this.prisma.relationalGlobalExecutiveSupervisionSignal.findMany({ where: { globalExecutiveSupervisionNodeId: node.id } }),
      this.prisma.relationalGlobalExecutiveSupervisionMatrix.findMany({ where: { globalExecutiveSupervisionNodeId: node.id } }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      matrices: matrices.map((b) => this.matrixWire(b)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: signals.length,
        matrixCount: matrices.length,
        executivePressureDetected: node.executivePressure >= 70,
        systemicExposureDetected: node.systemicExposure >= 68,
        supervisionPriorityDetected: node.executiveUrgency >= 55,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalGlobalExecutiveSupervisionOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_global_executive_supervision_overview_invalid" });
    return p.data;
  }

  @Get("global-executive-supervision-matrices/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async globalExecutiveSupervisionMatrixs(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const matrices = await this.prisma.relationalGlobalExecutiveSupervisionMatrix.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      matrices: matrices.map((b) => this.matrixWire(b)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("global-executive-supervision-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async globalExecutiveSupervisionSystemicExposure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalGlobalExecutiveSupervisionNode.findMany({
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

  @Get("global-executive-supervision-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async globalExecutiveSupervisionCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalGlobalExecutiveSupervisionNode.findMany({
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

  @Get("global-executive-supervision-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async globalExecutiveSupervisionPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalGlobalExecutiveSupervisionNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { systemicExposure: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: nodes.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        executiveUrgency: n.executiveUrgency,
        supervisionScore: n.supervisionScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("global-executive-supervision-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async globalExecutiveSupervisionBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalGlobalExecutiveSupervisionNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executivePressure, 0) / nodes.length)
        : 0;
    const meanConcentration =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicExposure, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      strategicAlignmentScore: meanBalance,
      executivePressure: meanPressure,
      systemicExposure: meanConcentration,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("global-executive-supervision-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async globalExecutiveSupervisionHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalGlobalExecutiveSupervisionSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalGlobalExecutiveSupervisionSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          supervisionStatus: s.supervisionStatus,
          supervisionScore: s.supervisionScore,
          systemicExposure: s.systemicExposure,
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

  @Post("archive-global-executive-supervision-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveGlobalExecutiveSupervisionSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalGlobalExecutiveSupervisionSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_global_executive_supervision_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_global_executive_supervision_relationship_not_found" });
    const gate = this.policy.assertGlobalExecutiveSupervisionMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_global_executive_supervision_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveGlobalExecutiveSupervisionSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalGlobalExecutiveSupervisionActionResponseSchema.safeParse({
      ok: true,
      code: "relational_global_executive_supervision_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_global_executive_supervision_action_invalid" });
    return p.data;
  }
}
