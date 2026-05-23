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
  RelationalExecutiveStrategicSynthesisDigest,
  RelationalExecutiveStrategicSynthesisNode,
  RelationalExecutiveStrategicSynthesisSignal,
} from "@prisma/client";
import {
  RelationalExecutiveStrategicSynthesisActionResponseSchema,
  RelationalExecutiveStrategicSynthesisOverviewSchema,
  RelationalExecutiveStrategicSynthesisSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalExecutiveStrategicSynthesisCorridorContextService } from "./relational-executive-strategic-synthesis-corridor-context.service";
import { RelationalExecutiveStrategicSynthesisEngineService } from "./relational-executive-strategic-synthesis-engine.service";
import { RelationalExecutiveStrategicSynthesisGuard } from "./relational-executive-strategic-synthesis.guard";
import { RelationalExecutiveStrategicSynthesisIngestionService } from "./relational-executive-strategic-synthesis-ingestion.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";

@Controller("relational-executive-strategic-synthesis")
@UseGuards(VenextAuthzGuard, RelationalExecutiveStrategicSynthesisGuard)
export class RelationalExecutiveStrategicSynthesisController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalExecutiveStrategicSynthesisPolicyService,
    private readonly corridorContext: RelationalExecutiveStrategicSynthesisCorridorContextService,
    private readonly engine: RelationalExecutiveStrategicSynthesisEngineService,
    private readonly ingestion: RelationalExecutiveStrategicSynthesisIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_executive_strategic_synthesis_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_executive_strategic_synthesis_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_executive_strategic_synthesis_relationship_not_found" });
  }

  private nodeWire(n: RelationalExecutiveStrategicSynthesisNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      synthesisType: n.synthesisType,
      synthesisPriority: n.synthesisPriority,
      synthesisStatus: n.synthesisStatus,
      severity: n.severity,
      synthesisScore: n.synthesisScore,
      systemicPressure: n.systemicPressure,
      resilienceStrength: n.resilienceStrength,
      executiveExposure: n.executiveExposure,
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

  private signalWire(s: RelationalExecutiveStrategicSynthesisSignal) {
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

  private digestWire(b: RelationalExecutiveStrategicSynthesisDigest) {
    return {
      id: b.id,
      digestCode: b.digestCode,
      digestType: b.digestType,
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

  @Get("executive-strategic-synthesis-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveStrategicSynthesisOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalExecutiveStrategicSynthesisNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeExecutiveStrategicSynthesisState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `STRAT_INTEL_NODE:${relationshipId}:preview`,
          synthesisType: state.synthesisType,
          synthesisPriority: state.synthesisPriority,
          synthesisStatus: state.synthesisStatus,
          severity: state.severity,
          synthesisScore: state.synthesisScore,
          systemicPressure: state.systemicPressure,
          resilienceStrength: state.resilienceStrength,
          executiveExposure: state.executiveExposure,
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
        digests: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          signalCount: 0,
          digestCount: 0,
          executiveExposureDetected: state.executiveInstabilityDetected,
          systemicPressureDetected: state.systemicEscalationDetected,
          strategicPriorityDetected: state.strategicPriorityDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalExecutiveStrategicSynthesisOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_executive_strategic_synthesis_overview_invalid" });
      return p.data;
    }
    const [signals, digests] = await Promise.all([
      this.prisma.relationalExecutiveStrategicSynthesisSignal.findMany({ where: { strategicSynthesisNodeId: node.id } }),
      this.prisma.relationalExecutiveStrategicSynthesisDigest.findMany({ where: { strategicSynthesisNodeId: node.id } }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      digests: digests.map((b) => this.digestWire(b)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: signals.length,
        digestCount: digests.length,
        executiveExposureDetected: node.executiveExposure >= 70,
        systemicPressureDetected: node.systemicPressure >= 68,
        strategicPriorityDetected: node.executiveUrgency >= 55,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalExecutiveStrategicSynthesisOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_executive_strategic_synthesis_overview_invalid" });
    return p.data;
  }

  @Get("executive-strategic-synthesis-digests/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveStrategicSynthesisDigests(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const digests = await this.prisma.relationalExecutiveStrategicSynthesisDigest.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      digests: digests.map((b) => this.digestWire(b)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-strategic-synthesis-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveStrategicSynthesisSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveStrategicSynthesisNode.findMany({
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

  @Get("executive-strategic-synthesis-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveStrategicSynthesisCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalExecutiveStrategicSynthesisNode.findMany({
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

  @Get("executive-strategic-synthesis-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveStrategicSynthesisPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveStrategicSynthesisNode.findMany({
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
        synthesisScore: n.synthesisScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("executive-strategic-synthesis-balance")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveStrategicSynthesisBalance(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalExecutiveStrategicSynthesisNode.findMany({
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

  @Get("executive-strategic-synthesis-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveStrategicSynthesisHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalExecutiveStrategicSynthesisSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalExecutiveStrategicSynthesisSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          synthesisStatus: s.synthesisStatus,
          synthesisScore: s.synthesisScore,
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

  @Post("archive-executive-strategic-synthesis-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveExecutiveStrategicSynthesisSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalExecutiveStrategicSynthesisSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_executive_strategic_synthesis_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_executive_strategic_synthesis_relationship_not_found" });
    const gate = this.policy.assertExecutiveStrategicSynthesisMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_executive_strategic_synthesis_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveExecutiveStrategicSynthesisSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalExecutiveStrategicSynthesisActionResponseSchema.safeParse({
      ok: true,
      code: "relational_executive_strategic_synthesis_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_executive_strategic_synthesis_action_invalid" });
    return p.data;
  }
}
