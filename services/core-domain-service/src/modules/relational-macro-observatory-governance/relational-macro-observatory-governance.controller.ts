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
  RelationalMacroObservatoryGovernanceMatrix,
  RelationalMacroObservatoryGovernanceNode,
  RelationalMacroObservatoryGovernanceSignal,
} from "@prisma/client";
import {
  RelationalMacroObservatoryGovernanceActionResponseSchema,
  RelationalMacroObservatoryGovernanceOverviewSchema,
  RelationalMacroObservatoryGovernanceSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalMacroObservatoryGovernanceCorridorContextService } from "./relational-macro-observatory-governance-corridor-context.service";
import { RelationalMacroObservatoryGovernanceEngineService } from "./relational-macro-observatory-governance-engine.service";
import { RelationalMacroObservatoryGovernanceGuard } from "./relational-macro-observatory-governance.guard";
import { RelationalMacroObservatoryGovernanceIngestionService } from "./relational-macro-observatory-governance-ingestion.service";
import { RelationalMacroObservatoryGovernancePolicyService } from "./relational-macro-observatory-governance-policy.service";

@Controller("relational-macro-observatory-governance")
@UseGuards(VenextAuthzGuard, RelationalMacroObservatoryGovernanceGuard)
export class RelationalMacroObservatoryGovernanceController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalMacroObservatoryGovernancePolicyService,
    private readonly corridorContext: RelationalMacroObservatoryGovernanceCorridorContextService,
    private readonly engine: RelationalMacroObservatoryGovernanceEngineService,
    private readonly ingestion: RelationalMacroObservatoryGovernanceIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_macro_observatory_governance_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_macro_observatory_governance_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_macro_observatory_governance_relationship_not_found" });
  }

  private nodeWire(n: RelationalMacroObservatoryGovernanceNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      macroGovernanceType: n.macroGovernanceType,
      macroGovernancePriority: n.macroGovernancePriority,
      macroGovernanceStatus: n.macroGovernanceStatus,
      severity: n.severity,
      macroGovernanceScore: n.macroGovernanceScore,
      systemicConcentration: n.systemicConcentration,
      resilienceStrength: n.resilienceStrength,
      executiveCoordinationPressure: n.executiveCoordinationPressure,
      networkAlignmentPressure: n.networkAlignmentPressure,
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

  private signalWire(s: RelationalMacroObservatoryGovernanceSignal) {
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

  private matrixWire(b: RelationalMacroObservatoryGovernanceMatrix) {
    return {
      id: b.id,
      matrixCode: b.matrixCode,
      matrixType: b.matrixType,
      severity: b.severity,
      priority: b.priority,
      title: b.title,
      summary: b.summary,
      institutionalPressure: b.institutionalPressure,
      executiveCoordinationPressure: b.executiveCoordinationPressure,
      createdAt: b.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("macro-observatory-governance-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async macroObservatoryGovernanceOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalMacroObservatoryGovernanceNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeMacroObservatoryGovernanceState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `STRAT_INTEL_NODE:${relationshipId}:preview`,
          macroGovernanceType: state.macroGovernanceType,
          macroGovernancePriority: state.macroGovernancePriority,
          macroGovernanceStatus: state.macroGovernanceStatus,
          severity: state.severity,
          macroGovernanceScore: state.macroGovernanceScore,
          systemicConcentration: state.systemicConcentration,
          resilienceStrength: state.resilienceStrength,
          executiveCoordinationPressure: state.executiveCoordinationPressure,
          networkAlignmentPressure: state.networkAlignmentPressure,
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
          executiveCoordinationPressureDetected: state.executiveAlignmentBreakdownDetected,
          systemicConcentrationDetected: state.systemicGovernanceConcentrationDetected,
          macroGovernancePriorityDetected: state.macroGovernancePriorityDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalMacroObservatoryGovernanceOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_macro_observatory_governance_overview_invalid" });
      return p.data;
    }
    const [signals, matrices] = await Promise.all([
      this.prisma.relationalMacroObservatoryGovernanceSignal.findMany({ where: { macroObservatoryGovernanceNodeId: node.id } }),
      this.prisma.relationalMacroObservatoryGovernanceMatrix.findMany({ where: { macroObservatoryGovernanceNodeId: node.id } }),
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
        executiveCoordinationPressureDetected: node.executiveCoordinationPressure >= 70,
        systemicConcentrationDetected: node.systemicConcentration >= 68,
        macroGovernancePriorityDetected: node.executiveUrgency >= 55,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalMacroObservatoryGovernanceOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_macro_observatory_governance_overview_invalid" });
    return p.data;
  }

  @Get("macro-observatory-governance-matrices/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async macroObservatoryGovernanceMatrixs(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const matrices = await this.prisma.relationalMacroObservatoryGovernanceMatrix.findMany({
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

  @Get("macro-observatory-governance-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async macroObservatoryGovernanceSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalMacroObservatoryGovernanceNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executiveCoordinationPressure, 0) / nodes.length)
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

  @Get("macro-observatory-governance-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async macroObservatoryGovernanceCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalMacroObservatoryGovernanceNode.findMany({
      where: {
        active: true,
        executiveUrgency: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { executiveCoordinationPressure: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        nodeCode: n.nodeCode,
        executiveUrgency: n.executiveUrgency,
        executiveCoordinationPressure: n.executiveCoordinationPressure,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("macro-observatory-governance-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async macroObservatoryGovernancePriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalMacroObservatoryGovernanceNode.findMany({
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
        macroGovernanceScore: n.macroGovernanceScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("macro-observatory-governance-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async macroObservatoryGovernanceBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalMacroObservatoryGovernanceNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.executiveCoordinationPressure, 0) / nodes.length)
        : 0;
    const meanConcentration =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicConcentration, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      strategicAlignmentScore: meanBalance,
      executiveCoordinationPressure: meanPressure,
      systemicConcentration: meanConcentration,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("macro-observatory-governance-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async macroObservatoryGovernanceHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalMacroObservatoryGovernanceSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalMacroObservatoryGovernanceSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          macroGovernanceStatus: s.macroGovernanceStatus,
          macroGovernanceScore: s.macroGovernanceScore,
          systemicConcentration: s.systemicConcentration,
          resilienceStrength: s.resilienceStrength,
          executiveCoordinationPressure: s.executiveCoordinationPressure,
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

  @Post("archive-macro-observatory-governance-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveMacroObservatoryGovernanceSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalMacroObservatoryGovernanceSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_macro_observatory_governance_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_macro_observatory_governance_relationship_not_found" });
    const gate = this.policy.assertMacroObservatoryGovernanceMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_macro_observatory_governance_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveMacroObservatoryGovernanceSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalMacroObservatoryGovernanceActionResponseSchema.safeParse({
      ok: true,
      code: "relational_macro_observatory_governance_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_macro_observatory_governance_action_invalid" });
    return p.data;
  }
}
