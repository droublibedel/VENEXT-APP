/**
 * Instruction 20.36 — REST API for relational strategic intelligence (non-autopilot).
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
  RelationalStrategicIntelligenceSynthesis,
  RelationalStrategicIntelligenceNode,
  RelationalStrategicIntelligenceSignal,
} from "@prisma/client";
import {
  RelationalStrategicIntelligenceActionResponseSchema,
  RelationalStrategicIntelligenceOverviewSchema,
  RelationalStrategicIntelligenceSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalStrategicIntelligenceCorridorContextService } from "./relational-strategic-intelligence-corridor-context.service";
import { RelationalStrategicIntelligenceEngineService } from "./relational-strategic-intelligence-engine.service";
import { RelationalStrategicIntelligenceGuard } from "./relational-strategic-intelligence.guard";
import { RelationalStrategicIntelligenceIngestionService } from "./relational-strategic-intelligence-ingestion.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";

@Controller("relational-strategic-intelligence")
@UseGuards(VenextAuthzGuard, RelationalStrategicIntelligenceGuard)
export class RelationalStrategicIntelligenceController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalStrategicIntelligencePolicyService,
    private readonly corridorContext: RelationalStrategicIntelligenceCorridorContextService,
    private readonly engine: RelationalStrategicIntelligenceEngineService,
    private readonly ingestion: RelationalStrategicIntelligenceIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_strategic_intelligence_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_strategic_intelligence_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_strategic_intelligence_relationship_not_found" });
  }

  private nodeWire(n: RelationalStrategicIntelligenceNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      intelligenceType: n.intelligenceType,
      intelligencePriority: n.intelligencePriority,
      intelligenceStatus: n.intelligenceStatus,
      severity: n.severity,
      strategicIntelligenceScore: n.strategicIntelligenceScore,
      executiveExposure: n.executiveExposure,
      resilienceStrength: n.resilienceStrength,
      systemicConcentration: n.systemicConcentration,
      strategicAlignmentScore: n.strategicAlignmentScore,
      governancePressure: n.governancePressure,
      arbitrationPressure: n.arbitrationPressure,
      stabilizationPressure: n.stabilizationPressure,
      monitoringPressure: n.monitoringPressure,
      orchestrationPressure: n.orchestrationPressure,
      institutionalPressure: n.institutionalPressure,
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

  private signalWire(s: RelationalStrategicIntelligenceSignal) {
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

  private synthesisWire(b: RelationalStrategicIntelligenceSynthesis) {
    return {
      id: b.id,
      synthesisCode: b.synthesisCode,
      synthesisType: b.synthesisType,
      severity: b.severity,
      priority: b.priority,
      title: b.title,
      summary: b.summary,
      institutionalPressure: b.institutionalPressure,
      systemicConcentration: b.systemicConcentration,
      createdAt: b.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-intelligence-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalStrategicIntelligenceNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeStrategicIntelligenceState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `STRAT_INTEL_NODE:${relationshipId}:preview`,
          intelligenceType: state.intelligenceType,
          intelligencePriority: state.intelligencePriority,
          intelligenceStatus: state.intelligenceStatus,
          severity: state.severity,
          strategicIntelligenceScore: state.strategicIntelligenceScore,
          executiveExposure: state.executiveExposure,
          resilienceStrength: state.resilienceStrength,
          systemicConcentration: state.systemicConcentration,
          strategicAlignmentScore: state.strategicAlignmentScore,
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
        syntheses: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          signalCount: 0,
          synthesisCount: 0,
          systemicPressureDetected: state.systemicPressureDetected,
          executiveExposureDetected: state.executiveExposureDetected,
          strategicPriorityDetected: state.strategicPriorityDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalStrategicIntelligenceOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_strategic_intelligence_overview_invalid" });
      return p.data;
    }
    const [signals, syntheses] = await Promise.all([
      this.prisma.relationalStrategicIntelligenceSignal.findMany({ where: { intelligenceNodeId: node.id } }),
      this.prisma.relationalStrategicIntelligenceSynthesis.findMany({ where: { intelligenceNodeId: node.id } }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      syntheses: syntheses.map((b) => this.synthesisWire(b)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: signals.length,
        synthesisCount: syntheses.length,
        systemicPressureDetected: node.systemicConcentration >= 70,
        executiveExposureDetected: node.executiveExposure >= 68,
        strategicPriorityDetected: node.executiveUrgency >= 55,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalStrategicIntelligenceOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_strategic_intelligence_overview_invalid" });
    return p.data;
  }

  @Get("strategic-intelligence-syntheses/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async strategicIntelligenceSyntheses(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const syntheses = await this.prisma.relationalStrategicIntelligenceSynthesis.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      syntheses: syntheses.map((b) => this.synthesisWire(b)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-intelligence-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalStrategicIntelligenceNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.systemicConcentration, 0) / nodes.length)
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

  @Get("strategic-intelligence-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalStrategicIntelligenceNode.findMany({
      where: {
        active: true,
        executiveUrgency: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { systemicConcentration: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        nodeCode: n.nodeCode,
        executiveUrgency: n.executiveUrgency,
        systemicConcentration: n.systemicConcentration,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-intelligence-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalStrategicIntelligenceNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { executiveExposure: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: nodes.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        executiveUrgency: n.executiveUrgency,
        strategicIntelligenceScore: n.strategicIntelligenceScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-intelligence-resilience")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingResilience(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalStrategicIntelligenceNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.strategicIntelligenceScore, 0) / nodes.length)
        : 0;
    const meanResilience =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.resilienceStrength, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      strategicIntelligenceScore: meanScore,
      resilienceStrength: meanResilience,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("strategic-intelligence-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalStrategicIntelligenceSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalStrategicIntelligenceSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          intelligenceStatus: s.intelligenceStatus,
          strategicIntelligenceScore: s.strategicIntelligenceScore,
          executiveExposure: s.executiveExposure,
          resilienceStrength: s.resilienceStrength,
          systemicConcentration: s.systemicConcentration,
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

  @Post("archive-strategic-intelligence-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveStrategicIntelligenceSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalStrategicIntelligenceSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_strategic_intelligence_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_strategic_intelligence_relationship_not_found" });
    const gate = this.policy.assertStrategicIntelligenceMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_strategic_intelligence_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveStrategicIntelligenceSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalStrategicIntelligenceActionResponseSchema.safeParse({
      ok: true,
      code: "relational_strategic_intelligence_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_strategic_intelligence_action_invalid" });
    return p.data;
  }
}
