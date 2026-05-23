/**
 * Instruction 20.38 — REST API for relational strategic intelligence (non-autopilot).
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
  RelationalExecutiveOperationsMatrix,
  RelationalExecutiveOperationsNode,
  RelationalExecutiveOperationsSignal,
} from "@prisma/client";
import {
  RelationalExecutiveOperationsActionResponseSchema,
  RelationalExecutiveOperationsOverviewSchema,
  RelationalExecutiveOperationsSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalExecutiveOperationsCorridorContextService } from "./relational-executive-operations-corridor-context.service";
import { RelationalExecutiveOperationsEngineService } from "./relational-executive-operations-engine.service";
import { RelationalExecutiveOperationsGuard } from "./relational-executive-operations.guard";
import { RelationalExecutiveOperationsIngestionService } from "./relational-executive-operations-ingestion.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";

@Controller("relational-executive-operations")
@UseGuards(VenextAuthzGuard, RelationalExecutiveOperationsGuard)
export class RelationalExecutiveOperationsController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalExecutiveOperationsPolicyService,
    private readonly corridorContext: RelationalExecutiveOperationsCorridorContextService,
    private readonly engine: RelationalExecutiveOperationsEngineService,
    private readonly ingestion: RelationalExecutiveOperationsIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_executive_operations_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_executive_operations_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_executive_operations_relationship_not_found" });
  }

  private nodeWire(n: RelationalExecutiveOperationsNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      operationsType: n.operationsType,
      operationsPriority: n.operationsPriority,
      operationsStatus: n.operationsStatus,
      severity: n.severity,
      executiveOperationsScore: n.executiveOperationsScore,
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

  private signalWire(s: RelationalExecutiveOperationsSignal) {
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

  private matrixWire(b: RelationalExecutiveOperationsMatrix) {
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

  @Get("executive-operations-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOperationsOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalExecutiveOperationsNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeExecutiveOperationsState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `STRAT_INTEL_NODE:${relationshipId}:preview`,
          operationsType: state.operationsType,
          operationsPriority: state.operationsPriority,
          operationsStatus: state.operationsStatus,
          severity: state.severity,
          executiveOperationsScore: state.executiveOperationsScore,
          systemicConcentration: state.systemicConcentration,
          resilienceStrength: state.resilienceStrength,
          executivePressure: state.executivePressure,
          strategicBalanceScore: state.strategicBalanceScore,
          governancePressure: state.governancePressure,
          arbitrationPressure: state.arbitrationPressure,
          stabilizationPressure: state.stabilizationPressure,
          monitoringPressure: state.monitoringPressure,
          orchestrationPressure: state.orchestrationPressure,
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
          systemicConcentrationDetected: state.coordinationCollapseDetected,
          strategicPriorityDetected: state.strategicPriorityDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalExecutiveOperationsOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_executive_operations_overview_invalid" });
      return p.data;
    }
    const [signals, matrices] = await Promise.all([
      this.prisma.relationalExecutiveOperationsSignal.findMany({ where: { operationsNodeId: node.id } }),
      this.prisma.relationalExecutiveOperationsMatrix.findMany({ where: { operationsNodeId: node.id } }),
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
        systemicConcentrationDetected: node.systemicConcentration >= 68,
        strategicPriorityDetected: node.executiveUrgency >= 55,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalExecutiveOperationsOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_executive_operations_overview_invalid" });
    return p.data;
  }

  @Get("executive-operations-matrices/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicIntelligenceSyntheses(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const matrices = await this.prisma.relationalExecutiveOperationsMatrix.findMany({
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

  @Get("executive-operations-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOperationsSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveOperationsNode.findMany({
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

  @Get("executive-operations-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOperationsCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalExecutiveOperationsNode.findMany({
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

  @Get("executive-operations-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOperationsPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveOperationsNode.findMany({
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
        executiveOperationsScore: n.executiveOperationsScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-operations-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOperationsBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveOperationsNode.findMany({
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

  @Get("executive-operations-resilience")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOperationsResilience(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveOperationsNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      take: 48,
    });
    const meanScore =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executiveOperationsScore, 0) / nodes.length)
        : 0;
    const meanResilience =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.resilienceStrength, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      executiveOperationsScore: meanScore,
      resilienceStrength: meanResilience,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-operations-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveOperationsHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalExecutiveOperationsSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalExecutiveOperationsSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          operationsStatus: s.operationsStatus,
          executiveOperationsScore: s.executiveOperationsScore,
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

  @Post("archive-executive-operations-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveExecutiveOperationsSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalExecutiveOperationsSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_executive_operations_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_executive_operations_relationship_not_found" });
    const gate = this.policy.assertExecutiveOperationsMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_executive_operations_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveExecutiveOperationsSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalExecutiveOperationsActionResponseSchema.safeParse({
      ok: true,
      code: "relational_executive_operations_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_executive_operations_action_invalid" });
    return p.data;
  }
}
