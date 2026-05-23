/**
 * Instruction 20.23 — REST API for relational sector intelligence & market structure.
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
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Prisma, RelationalSectorDependency, RelationalSectorNode, RelationalSectorSignal } from "@prisma/client";
import {
  ActionResponseSchema,
  DependencyMapOverviewSchema,
  MarketStructureOverviewSchema,
  OverviewSchema,
  SectorArchiveSignalRequestSchema,
  SectorExpansionOpportunitiesSchema,
  SectorPropagationMapSchema,
  SectorPressureOverviewSchema,
  SystemicSectorRiskSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalSectorExpansionService } from "./relational-sector-expansion.service";
import { RelationalSectorMarketStructureService, type MarketStructureVector } from "./relational-sector-market-structure.service";
import { RelationalSectorPolicyService } from "./relational-sector-policy.service";
import { RelationalSectorPropagationService } from "./relational-sector-propagation.service";
import { RelationalSectorDependencyService } from "./relational-sector-dependency.service";
import { RelationalSectorGuard } from "./relational-sector.guard";

@Controller("relational-sector-intelligence")
@UseGuards(VenextAuthzGuard, RelationalSectorGuard)
export class RelationalSectorController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalSectorPolicyService,
    private readonly sectorMarketStructure: RelationalSectorMarketStructureService,
    private readonly propagation: RelationalSectorPropagationService,
    private readonly expansion: RelationalSectorExpansionService,
    private readonly sectorDependency: RelationalSectorDependencyService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_sector_intelligence_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_sector_intelligence_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_sector_relationship_not_found" });
  }

  private nodeWire(n: RelationalSectorNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      sectorCode: n.sectorCode,
      sectorType: n.sectorType,
      sectorName: n.sectorName,
      sectorSlug: n.sectorSlug,
      territoryCountry: n.territoryCountry,
      territoryCity: n.territoryCity,
      marketStructureType: n.marketStructureType,
      concentrationLevel: n.concentrationLevel,
      pressureLevel: n.pressureLevel,
      operationalRiskScore: n.operationalRiskScore,
      expansionPotentialScore: n.expansionPotentialScore,
      fragilityScore: n.fragilityScore,
      dependencyScore: n.dependencyScore,
      active: n.active,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private depWire(d: RelationalSectorDependency) {
    return {
      id: d.id,
      sourceSectorId: d.sourceSectorId,
      targetSectorId: d.targetSectorId,
      dependencyType: d.dependencyType,
      dependencyStrength: d.dependencyStrength,
      propagationProbability: d.propagationProbability,
      riskTransferScore: d.riskTransferScore,
      sharedPressureScore: d.sharedPressureScore,
      createdAt: d.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private signalWire(s: RelationalSectorSignal) {
    return {
      id: s.id,
      relationshipId: s.relationshipId,
      sectorNodeId: s.sectorNodeId,
      signalType: s.signalType,
      severity: s.severity,
      title: s.title,
      description: s.description,
      signalScore: s.signalScore,
      propagationRisk: s.propagationRisk,
      pressureContribution: s.pressureContribution,
      createdAt: s.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("sector-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async sectorOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSectorNode.findMany({
      where: { relationshipId },
      orderBy: { operationalRiskScore: "desc" },
      take: 24,
    });
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      narrative:
        "Supervision sectorielle corridor-first — chaînes de valeur observées, structures de marché dérivées déterministement — pas ERP ni CRM.",
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = OverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_sector_overview_invalid" });
    return p.data;
  }

  @Get("market-structure/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async marketStructure(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const n = await this.prisma.relationalSectorNode.findFirst({
      where: { relationshipId },
      orderBy: { updatedAt: "desc" },
    });
    if (!n) throw new NotFoundException({ code: "relational_sector_node_missing" });
    const stored = (n.diagnostics as { vector?: Record<string, unknown> } | null)?.vector;
    const baseVector =
      stored &&
      typeof stored.sectorConcentration === "number" &&
      typeof stored.corridorSaturation === "number" &&
      Array.isArray(stored.explainers)
        ? (stored as MarketStructureVector)
        : this.sectorMarketStructure.computeMarketStructureVector({
            pressureScore: n.operationalRiskScore,
            fragilityScore: n.fragilityScore,
            dependencyDensity: n.dependencyScore,
            peerCount: 4,
            geoZoneAvgPressure: n.operationalRiskScore,
            fulfillmentStress: 20,
            sectorPairCount: 2,
          });
    const vector = {
      ...baseVector,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const raw = {
      relationshipId,
      marketStructureType: n.marketStructureType,
      vector,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = MarketStructureOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_sector_market_structure_invalid" });
    return p.data;
  }

  @Get("propagation-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async propagationMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const { cascadePaths, maxDepthObserved } = await this.propagation.projectInterSectorPropagation(relationshipId);
    const raw = {
      relationshipId,
      maxDepthObserved,
      cascadePaths,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = SectorPropagationMapSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_sector_propagation_map_invalid" });
    return p.data;
  }

  @Get("pressure-zones/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async pressureZones(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSectorNode.findMany({ where: { relationshipId }, take: 24 });
    const pressureBands = nodes.map((x) => ({
      sectorSlug: x.sectorSlug,
      pressureLevel: x.pressureLevel,
      score: x.operationalRiskScore,
    }));
    const cumulative =
      nodes.length === 0 ? 0 : this.policy.clampInt(nodes.reduce((s, x) => s + x.operationalRiskScore, 0) / nodes.length);
    const raw = {
      relationshipId,
      pressureBands,
      cumulative,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = SectorPressureOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_sector_pressure_zones_invalid" });
    return p.data;
  }

  @Get("expansion-opportunities/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async expansionOpportunities(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSectorNode.findMany({ where: { relationshipId }, take: 24 });
    const diag = (nodes[0]?.diagnostics as { vector?: { sectorConcentration?: number } } | null)?.vector;
    const conc = diag?.sectorConcentration ?? 40;
    const opps = this.expansion.buildOpportunities(
      nodes.map((n) => ({
        sectorSlug: n.sectorSlug,
        expansionPotentialScore: n.expansionPotentialScore,
        concentration: conc,
      })),
    );
    const raw = {
      relationshipId,
      opportunities: opps,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = SectorExpansionOpportunitiesSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_sector_expansion_invalid" });
    return p.data;
  }

  @Get("dependency-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async dependencyMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSectorNode.findMany({ where: { relationshipId }, take: 24 });
    const edges = await this.sectorDependency.listDependenciesForRelationship(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.depWire(e)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = DependencyMapOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_sector_dependency_map_invalid" });
    return p.data;
  }

  @Get("systemic-sector-risk/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async systemicSectorRisk(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSectorNode.findMany({ where: { relationshipId }, take: 24 });
    const { cascadePaths } = await this.propagation.projectInterSectorPropagation(relationshipId);
    const exposure = this.propagation.systemicExposureScore(cascadePaths);
    const riskScore = this.policy.clampInt(
      nodes.reduce((m, n) => Math.max(m, n.operationalRiskScore), 0) * 0.55 + exposure * 0.45,
    );
    const drivers = [
      `max_operational_risk:${nodes.reduce((m, n) => Math.max(m, n.operationalRiskScore), 0)}`,
      `propagation_exposure:${exposure}`,
    ];
    const raw = {
      relationshipId,
      riskScore,
      drivers,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = SystemicSectorRiskSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_sector_systemic_risk_invalid" });
    return p.data;
  }

  @Post("archive-sector-signal/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveSectorSignal(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req()
    req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const parsed = SectorArchiveSignalRequestSchema.safeParse(body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "relational_sector_archive_invalid" });
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;

    const sig = await this.prisma.relationalSectorSignal.findUnique({
      where: { id },
      include: { sectorNode: { select: { relationshipId: true } } },
    });
    if (!sig) throw new NotFoundException({ code: "relational_sector_signal_not_found" });
    await this.assertOrgOnRelationship(organizationId, sig.relationshipId);
    await this.governance.assertCorridorOperational(sig.relationshipId, "operational_observation");
    const rel = await this.prisma.relationship.findUnique({
      where: { id: sig.relationshipId },
      select: { corridorState: true },
    });
    if (!rel) throw new NotFoundException(sig.relationshipId);
    if (!this.policy.canMutateSectorState(rel.corridorState)) {
      throw new ForbiddenException({ code: "relational_sector_corridor_readonly" });
    }

    const prev = (sig.metadata as Record<string, unknown> | null) ?? {};
    const metadata: Prisma.InputJsonValue = {
      ...prev,
      archived: true,
      archivedAt: new Date().toISOString(),
      archiveReason: parsed.data.archiveReason,
      archivedByUserId: actor.userId,
    };
    const updated = await this.prisma.relationalSectorSignal.update({
      where: { id },
      data: { metadata },
    });

    await this.prisma.relationalSectorEvent.create({
      data: {
        eventType: "SIGNAL_ARCHIVED",
        sectorNodeId: sig.sectorNodeId,
        relationshipId: sig.relationshipId,
        actorOrganizationId: actor.organizationId,
        diagnostics: { signalId: id, reason: parsed.data.archiveReason } as Prisma.InputJsonValue,
      },
    });

    const res = ActionResponseSchema.safeParse({
      signal: this.signalWire(updated),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!res.success) throw new BadRequestException({ code: "relational_sector_archive_response_invalid" });
    return res.data;
  }
}
