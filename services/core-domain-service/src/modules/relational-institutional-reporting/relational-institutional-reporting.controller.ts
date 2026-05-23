/**
 * Instruction 20.35 — REST API for relational institutional reporting (non-autopilot).
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
  RelationalInstitutionalReportingBrief,
  RelationalInstitutionalReportingNode,
  RelationalInstitutionalReportingSignal,
} from "@prisma/client";
import {
  RelationalInstitutionalReportingActionResponseSchema,
  RelationalInstitutionalReportingOverviewSchema,
  RelationalInstitutionalReportingSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalInstitutionalReportingCorridorContextService } from "./relational-institutional-reporting-corridor-context.service";
import { RelationalInstitutionalReportingEngineService } from "./relational-institutional-reporting-engine.service";
import { RelationalInstitutionalReportingGuard } from "./relational-institutional-reporting.guard";
import { RelationalInstitutionalReportingIngestionService } from "./relational-institutional-reporting-ingestion.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";

@Controller("relational-institutional-reporting")
@UseGuards(VenextAuthzGuard, RelationalInstitutionalReportingGuard)
export class RelationalInstitutionalReportingController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalInstitutionalReportingPolicyService,
    private readonly corridorContext: RelationalInstitutionalReportingCorridorContextService,
    private readonly engine: RelationalInstitutionalReportingEngineService,
    private readonly ingestion: RelationalInstitutionalReportingIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_institutional_reporting_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_institutional_reporting_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_institutional_reporting_relationship_not_found" });
  }

  private nodeWire(n: RelationalInstitutionalReportingNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      nodeCode: n.nodeCode,
      reportingType: n.reportingType,
      reportingPriority: n.reportingPriority,
      reportingStatus: n.reportingStatus,
      severity: n.severity,
      institutionalScore: n.institutionalScore,
      executiveRisk: n.executiveRisk,
      strategicResilience: n.strategicResilience,
      systemicExposure: n.systemicExposure,
      strategicAlignmentScore: n.strategicAlignmentScore,
      governancePressure: n.governancePressure,
      arbitrationPressure: n.arbitrationPressure,
      stabilizationPressure: n.stabilizationPressure,
      monitoringPressure: n.monitoringPressure,
      orchestrationPressure: n.orchestrationPressure,
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

  private signalWire(s: RelationalInstitutionalReportingSignal) {
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

  private briefWire(b: RelationalInstitutionalReportingBrief) {
    return {
      id: b.id,
      briefCode: b.briefCode,
      briefType: b.briefType,
      severity: b.severity,
      priority: b.priority,
      title: b.title,
      summary: b.summary,
      institutionalPressure: b.institutionalPressure,
      systemicExposure: b.systemicExposure,
      createdAt: b.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("institutional-reporting-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const node = await this.prisma.relationalInstitutionalReportingNode.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!node) {
      const ctx = await this.corridorContext.load(relationshipId);
      const state = this.engine.computeInstitutionalReportingState(ctx);
      const raw = {
        relationshipId,
        node: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          nodeCode: `INST_REP_NODE:${relationshipId}:preview`,
          reportingType: state.reportingType,
          reportingPriority: state.reportingPriority,
          reportingStatus: state.reportingStatus,
          severity: state.severity,
          institutionalScore: state.institutionalScore,
          executiveRisk: state.executiveRisk,
          strategicResilience: state.strategicResilience,
          systemicExposure: state.systemicExposure,
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
        briefs: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          signalCount: 0,
          briefCount: 0,
          systemicRiskDetected: state.systemicRiskDetected,
          executivePressureDetected: state.executivePressureDetected,
          institutionalPriorityDetected: state.institutionalPriorityDetected,
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalInstitutionalReportingOverviewSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_institutional_reporting_overview_invalid" });
      return p.data;
    }
    const [signals, briefs] = await Promise.all([
      this.prisma.relationalInstitutionalReportingSignal.findMany({ where: { reportingNodeId: node.id } }),
      this.prisma.relationalInstitutionalReportingBrief.findMany({ where: { reportingNodeId: node.id } }),
    ]);
    const raw = {
      relationshipId,
      node: this.nodeWire(node),
      signals: signals.map((s) => this.signalWire(s)),
      briefs: briefs.map((b) => this.briefWire(b)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: signals.length,
        briefCount: briefs.length,
        systemicRiskDetected: node.systemicExposure >= 70,
        executivePressureDetected: node.executiveRisk >= 68,
        institutionalPriorityDetected: node.executiveUrgency >= 55,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalInstitutionalReportingOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_institutional_reporting_overview_invalid" });
    return p.data;
  }

  @Get("institutional-reporting-briefs/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingBriefs(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const briefs = await this.prisma.relationalInstitutionalReportingBrief.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 64,
    });
    return {
      relationshipId,
      briefs: briefs.map((b) => this.briefWire(b)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("institutional-reporting-systemic-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingSystemicPressure(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalInstitutionalReportingNode.findMany({
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

  @Get("institutional-reporting-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalInstitutionalReportingNode.findMany({
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

  @Get("institutional-reporting-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalInstitutionalReportingNode.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ executiveUrgency: "desc" }, { executiveRisk: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: nodes.map((n) => ({
        relationshipId: n.relationshipId,
        nodeId: n.id,
        executiveUrgency: n.executiveUrgency,
        institutionalScore: n.institutionalScore,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("institutional-reporting-resilience")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingResilience(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const nodes = await this.prisma.relationalInstitutionalReportingNode.findMany({
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
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.institutionalScore, 0) / nodes.length)
        : 0;
    const meanResilience =
      nodes.length > 0
        ? this.policy.clampInt(nodes.reduce((a, n) => a + n.strategicResilience, 0) / nodes.length)
        : 0;
    return {
      organizationId,
      institutionalScore: meanScore,
      strategicResilience: meanResilience,
      corridorCount: nodes.length,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("institutional-reporting-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async institutionalReportingHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snapshots = await this.prisma.relationalInstitutionalReportingSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    return {
      relationshipId,
      snapshots: snapshots.map((s) =>
        RelationalInstitutionalReportingSnapshotSchema.parse({
          id: s.id,
          relationshipId: s.relationshipId,
          snapshotCode: s.snapshotCode,
          reportingStatus: s.reportingStatus,
          institutionalScore: s.institutionalScore,
          executiveRisk: s.executiveRisk,
          strategicResilience: s.strategicResilience,
          systemicExposure: s.systemicExposure,
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

  @Post("archive-institutional-reporting-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveInstitutionalReportingSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { actorOrganizationId?: string },
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalInstitutionalReportingSnapshot.findUnique({
      where: { id },
      select: { relationshipId: true },
    });
    if (!snap) throw new NotFoundException({ code: "relational_institutional_reporting_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    const rel = await this.prisma.relationship.findUnique({
      where: { id: snap.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_institutional_reporting_relationship_not_found" });
    const gate = this.policy.assertInstitutionalReportingMutationAllowed(rel.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_institutional_reporting_corridor_readonly",
        diagnostics: gate.diagnostics,
      });
    }
    await this.ingestion.archiveInstitutionalReportingSnapshot(id, body.actorOrganizationId ?? organizationId);
    const p = RelationalInstitutionalReportingActionResponseSchema.safeParse({
      ok: true,
      code: "relational_institutional_reporting_snapshot_archived",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!p.success) throw new BadRequestException({ code: "relational_institutional_reporting_action_invalid" });
    return p.data;
  }
}
