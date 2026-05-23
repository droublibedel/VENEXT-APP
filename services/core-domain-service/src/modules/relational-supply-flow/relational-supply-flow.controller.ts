/**
 * Instruction 20.24 — REST API for relational supply flow intelligence (corridor-first).
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
import type { Prisma, RelationalSupplyFlowEdge, RelationalSupplyFlowNode } from "@prisma/client";
import { RelationalFulfillmentIncidentResolutionStatus, RelationalSupplyFlowEventType } from "@prisma/client";
import {
  RelationalSupplyFlowActionResponseSchema,
  RelationalSupplyFlowOverviewSchema,
  RelationalSupplyFlowPressureOverviewSchema,
  RelationalSupplyFlowPropagationSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalSupplyFlowBottleneckService } from "./relational-supply-flow-bottleneck.service";
import { RelationalSupplyFlowCorridorContextService } from "./relational-supply-flow-corridor-context.service";
import { RelationalSupplyFlowDependencyService } from "./relational-supply-flow-dependency.service";
import { RelationalSupplyFlowGuard } from "./relational-supply-flow.guard";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";
import { RelationalSupplyFlowPressureService } from "./relational-supply-flow-pressure.service";
import { RelationalSupplyFlowPropagationService } from "./relational-supply-flow-propagation.service";

@Controller("relational-supply-flow")
@UseGuards(VenextAuthzGuard, RelationalSupplyFlowGuard)
export class RelationalSupplyFlowController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalSupplyFlowPolicyService,
    private readonly corridorContext: RelationalSupplyFlowCorridorContextService,
    private readonly pressure: RelationalSupplyFlowPressureService,
    private readonly bottleneck: RelationalSupplyFlowBottleneckService,
    private readonly dependency: RelationalSupplyFlowDependencyService,
    private readonly propagation: RelationalSupplyFlowPropagationService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_supply_flow_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_supply_flow_disabled" });
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
    if (!rel) throw new NotFoundException({ code: "relational_supply_flow_relationship_not_found" });
  }

  private async buildOverviewDiagnostics(relationshipId: string) {
    const [corridor, map] = await Promise.all([
      this.corridorContext.load(relationshipId),
      this.propagation.buildFlowPropagationMap(relationshipId),
    ]);
    return {
      heuristicFallbackUsed: corridor.heuristicFallbackUsed,
      fallbackReasons: corridor.fallbackReasons,
      predictiveSignalsUsed: corridor.predictiveUnresolvedCount,
      strategicMemoriesUsed: corridor.strategicMemoryActiveCount,
      operationalMetricsUsed: corridor.operationalMetricsUsed,
      productFlowCategories: corridor.productFlowCategories,
      dominantProductCategory: corridor.dominantProductCategory,
      volumeConfidenceLevel: corridor.volumeConfidenceLevel,
      propagationTraversal: map.traversalDiagnostics,
      downstreamImpact: map.downstreamImpact,
    };
  }

  private nodeWire(n: RelationalSupplyFlowNode) {
    return {
      id: n.id,
      relationshipId: n.relationshipId,
      sectorNodeId: n.sectorNodeId,
      geoZoneId: n.geoZoneId,
      flowCode: n.flowCode,
      flowType: n.flowType,
      flowName: n.flowName,
      sourceOrganizationId: n.sourceOrganizationId,
      targetOrganizationId: n.targetOrganizationId,
      productCategory: n.productCategory,
      territoryCountry: n.territoryCountry,
      territoryCity: n.territoryCity,
      pressureLevel: n.pressureLevel,
      riskLevel: n.riskLevel,
      flowVolumeScore: n.flowVolumeScore,
      flowStabilityScore: n.flowStabilityScore,
      fulfillmentReliabilityScore: n.fulfillmentReliabilityScore,
      supplyContinuityScore: n.supplyContinuityScore,
      disruptionRiskScore: n.disruptionRiskScore,
      bottleneckScore: n.bottleneckScore,
      dependencyScore: n.dependencyScore,
      active: n.active,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private edgeWire(e: RelationalSupplyFlowEdge) {
    return {
      id: e.id,
      sourceFlowId: e.sourceFlowId,
      targetFlowId: e.targetFlowId,
      dependencyType: e.dependencyType,
      dependencyStrength: e.dependencyStrength,
      propagationProbability: e.propagationProbability,
      bottleneckTransferScore: e.bottleneckTransferScore,
      sharedPressureScore: e.sharedPressureScore,
      createdAt: e.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("flow-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async flowOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSupplyFlowNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalSupplyFlowEdge.findMany({
      where: { sourceFlow: { relationshipId } },
      take: 96,
    });
    const overviewDiagnostics = await this.buildOverviewDiagnostics(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      overviewDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalSupplyFlowOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_supply_flow_overview_invalid" });
    return p.data;
  }

  @Get("pressure-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async pressureOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSupplyFlowNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalSupplyFlowEdge.findMany({
      where: { sourceFlow: { relationshipId } },
      take: 96,
      select: { sourceFlowId: true, targetFlowId: true },
    });
    const incidentCount = await this.prisma.relationalFulfillmentIncident.count({
      where: {
        fulfillmentRecord: { relationshipId },
        resolutionStatus: RelationalFulfillmentIncidentResolutionStatus.OPEN,
      },
    });
    const fulfillmentCount = await this.prisma.relationalFulfillmentRecord.count({ where: { relationshipId } });
    const [corridor, map] = await Promise.all([
      this.corridorContext.load(relationshipId),
      this.propagation.buildFlowPropagationMap(relationshipId),
    ]);
    const overviewDiagnostics = {
      heuristicFallbackUsed: corridor.heuristicFallbackUsed,
      fallbackReasons: corridor.fallbackReasons,
      predictiveSignalsUsed: corridor.predictiveUnresolvedCount,
      strategicMemoriesUsed: corridor.strategicMemoryActiveCount,
      operationalMetricsUsed: corridor.operationalMetricsUsed,
      productFlowCategories: corridor.productFlowCategories,
      dominantProductCategory: corridor.dominantProductCategory,
      volumeConfidenceLevel: corridor.volumeConfidenceLevel,
      propagationTraversal: map.traversalDiagnostics,
      downstreamImpact: map.downstreamImpact,
    };
    const ov = this.pressure.computeSupplyFlowOverview(nodes, edges, incidentCount, fulfillmentCount, {
      cascadePaths: map.cascadePaths,
      maxDepthObserved: map.maxDepthObserved,
    });
    const raw = {
      relationshipId,
      ...ov,
      overviewDiagnostics,
      criticalFlows: ov.criticalFlows.map((x) => ({ ...x, paymentExecutionDisabled: true as const, publicTrackingDisabled: true as const })),
      bottleneckFlows: ov.bottleneckFlows.map((x) => ({
        ...x,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      disruptionRisks: ov.disruptionRisks.map((x) => ({
        ...x,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      continuityWarnings: ov.continuityWarnings.map((x) => ({
        ...x,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      dependencyWarnings: ov.dependencyWarnings.map((x) => ({
        ...x,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalSupplyFlowPressureOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_supply_flow_pressure_invalid" });
    return p.data;
  }

  @Get("bottlenecks/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bottlenecks(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSupplyFlowNode.findMany({ where: { relationshipId }, take: 48 });
    const incidentCount = await this.prisma.relationalFulfillmentIncident.count({
      where: {
        fulfillmentRecord: { relationshipId },
        resolutionStatus: RelationalFulfillmentIncidentResolutionStatus.OPEN,
      },
    });
    const fulfillmentCount = await this.prisma.relationalFulfillmentRecord.count({ where: { relationshipId } });
    const hits = this.bottleneck.detectBottleneckFlows(nodes, incidentCount, fulfillmentCount);
    return {
      relationshipId,
      bottlenecks: nodes
        .map((n) => {
          const h = hits.get(n.id);
          return h
            ? {
                node: this.nodeWire(n),
                bottleneckReason: h.bottleneckReason,
                bottleneckDiagnostics: h.bottleneckDiagnostics,
                bottleneckScore: h.bottleneckScore,
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
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
    const nodes = await this.prisma.relationalSupplyFlowNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalSupplyFlowEdge.findMany({
      where: { sourceFlow: { relationshipId } },
      take: 96,
    });
    const prim = nodes[0];
    const sec = nodes[1];
    const asym = prim && sec ? this.dependency.detectAsymmetricFlowDependency(prim, sec) : 0;
    const systemic = this.dependency.computeFlowSystemicWeight(nodes);
    return {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      asymmetricDependencyScore: asym,
      systemicWeight: systemic,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
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
    const nodes = await this.prisma.relationalSupplyFlowNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalSupplyFlowEdge.findMany({
      where: { sourceFlow: { relationshipId } },
      take: 96,
    });
    const map = await this.propagation.buildFlowPropagationMap(relationshipId);
    const raw = {
      relationshipId,
      nodes: nodes.map((n) => this.nodeWire(n)),
      edges: edges.map((e) => this.edgeWire(e)),
      cascadePaths: map.cascadePaths,
      maxDepthObserved: map.maxDepthObserved,
      downstreamImpact: map.downstreamImpact,
      traversalDiagnostics: map.traversalDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalSupplyFlowPropagationSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_supply_flow_propagation_invalid" });
    return p.data;
  }

  @Get("critical-flows")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async criticalFlows(@Query("organizationId") organizationId: string, @Query("relationshipId") relationshipId: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(relationshipId)) {
      throw new BadRequestException({ code: "relational_supply_flow_missing_relationship" });
    }
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const nodes = await this.prisma.relationalSupplyFlowNode.findMany({ where: { relationshipId }, take: 48 });
    const edges = await this.prisma.relationalSupplyFlowEdge.findMany({
      where: { sourceFlow: { relationshipId } },
      take: 96,
      select: { sourceFlowId: true, targetFlowId: true },
    });
    const incidentCount = await this.prisma.relationalFulfillmentIncident.count({
      where: {
        fulfillmentRecord: { relationshipId },
        resolutionStatus: RelationalFulfillmentIncidentResolutionStatus.OPEN,
      },
    });
    const fulfillmentCount = await this.prisma.relationalFulfillmentRecord.count({ where: { relationshipId } });
    const [corridor, map] = await Promise.all([
      this.corridorContext.load(relationshipId),
      this.propagation.buildFlowPropagationMap(relationshipId),
    ]);
    const overviewDiagnostics = {
      heuristicFallbackUsed: corridor.heuristicFallbackUsed,
      fallbackReasons: corridor.fallbackReasons,
      predictiveSignalsUsed: corridor.predictiveUnresolvedCount,
      strategicMemoriesUsed: corridor.strategicMemoryActiveCount,
      operationalMetricsUsed: corridor.operationalMetricsUsed,
      productFlowCategories: corridor.productFlowCategories,
      dominantProductCategory: corridor.dominantProductCategory,
      volumeConfidenceLevel: corridor.volumeConfidenceLevel,
      propagationTraversal: map.traversalDiagnostics,
      downstreamImpact: map.downstreamImpact,
    };
    const ov = this.pressure.computeSupplyFlowOverview(nodes, edges, incidentCount, fulfillmentCount, {
      cascadePaths: map.cascadePaths,
      maxDepthObserved: map.maxDepthObserved,
    });
    return {
      relationshipId,
      overviewDiagnostics,
      criticalFlows: ov.criticalFlows.map((x) => ({
        ...x,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Post("archive-flow/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveFlow(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() _body: Record<string, unknown>,
  ) {
    void _body;
    await this.assertFlag(organizationId);
    const node = await this.prisma.relationalSupplyFlowNode.findUnique({
      where: { id },
      include: { relationship: { select: { corridorState: true, requesterOrganizationId: true, receiverOrganizationId: true } } },
    });
    if (!node) throw new NotFoundException({ code: "relational_supply_flow_node_not_found" });
    await this.assertOrgOnRelationship(organizationId, node.relationshipId);
    await this.governance.assertCorridorOperational(node.relationshipId, "operational_observation");
    const mutationGate = this.policy.assertSupplyFlowMutationAllowed(node.relationship.corridorState);
    if (!mutationGate.allowed) {
      throw new ForbiddenException({ code: "relational_supply_flow_corridor_readonly", detail: mutationGate.diagnostics });
    }
    await this.prisma.relationalSupplyFlowNode.update({
      where: { id },
      data: { active: false },
    });
    await this.prisma.relationalSupplyFlowEvent.create({
      data: {
        relationshipId: node.relationshipId,
        flowNodeId: id,
        eventType: RelationalSupplyFlowEventType.FLOW_ARCHIVED,
        actorOrganizationId: organizationId,
        diagnostics: { archivedFlowId: id } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
    const raw = { ok: true as const, code: "relational_supply_flow_archived", paymentExecutionDisabled: true as const, publicTrackingDisabled: true as const };
    const p = RelationalSupplyFlowActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_supply_flow_action_invalid" });
    return p.data;
  }
}
