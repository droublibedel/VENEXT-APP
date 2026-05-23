import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicDependencyStatus,
  RelationalFulfillmentIncidentResolutionStatus,
  RelationalFulfillmentTaskStatus,
  RelationalStrategicMemoryStatus,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";

export type MacroEconomicCorridorContext = {
  relationshipId: string;
  hasOrder: boolean;
  buyerOrganizationId: string | null;
  sellerOrganizationId: string | null;
  territoryCountry: string;
  territoryCity: string;
  sectorNodeId: string | null;
  sectorSlug: string | null;
  geoZoneId: string | null;
  economicDependencyNodeId: string | null;
  primarySupplyFlowNodeId: string | null;
  pressureScore: number;
  fragilityScore: number;
  geoFragilityScore: number;
  sectorOperationalRisk: number;
  sectorFragility: number;
  supplyFlowDisruptionAvg: number;
  supplyFlowNodesUsed: number;
  sectorNodesUsed: number;
  openIncidentCount: number;
  coordinationOpenCount: number;
  blockingTaskCount: number;
  predictiveUnresolvedCount: number;
  predictiveUnresolvedAvgScore: number;
  strategicMemoryActiveCount: number;
  strategicMemoryAvgConfidence: number;
  operationalMetricStress: number;
  operationalMetricsUsed: number;
  commandCenterStress: number;
  peerPressureEdgeCount: number;
  orchestrationOpenCount: number;
  simulationOpenCount: number;
  scenarioReviewOpenCount: number;
  heuristicFallbackUsed: boolean;
  fallbackReasons: string[];
};

@Injectable()
export class RelationalMacroEconomicCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalMacroEconomicPolicyService,
  ) {}

  async load(relationshipId: string): Promise<MacroEconomicCorridorContext> {
    const fallbackReasons: string[] = [];
    let heuristicFallbackUsed = false;

    const order = await this.prisma.order.findFirst({
      where: { relationshipId },
      select: { id: true, buyerOrganizationId: true, sellerOrganizationId: true },
      orderBy: { createdAt: "desc" },
    });

    if (!order) {
      return {
        relationshipId,
        hasOrder: false,
        buyerOrganizationId: null,
        sellerOrganizationId: null,
        territoryCountry: "UN",
        territoryCity: "UN",
        sectorNodeId: null,
        sectorSlug: null,
        geoZoneId: null,
        economicDependencyNodeId: null,
        primarySupplyFlowNodeId: null,
        pressureScore: 0,
        fragilityScore: 0,
        geoFragilityScore: 0,
        sectorOperationalRisk: 0,
        sectorFragility: 0,
        supplyFlowDisruptionAvg: 0,
        supplyFlowNodesUsed: 0,
        sectorNodesUsed: 0,
        openIncidentCount: 0,
        coordinationOpenCount: 0,
        blockingTaskCount: 0,
        predictiveUnresolvedCount: 0,
        predictiveUnresolvedAvgScore: 0,
        strategicMemoryActiveCount: 0,
        strategicMemoryAvgConfidence: 0,
        operationalMetricStress: 0,
        operationalMetricsUsed: 0,
        commandCenterStress: 0,
        peerPressureEdgeCount: 0,
        orchestrationOpenCount: 0,
        simulationOpenCount: 0,
        scenarioReviewOpenCount: 0,
        heuristicFallbackUsed: true,
        fallbackReasons: ["no_order_for_corridor"],
      };
    }

    const [
      buyerOrg,
      sectorRow,
      sectorAgg,
      zoneLink,
      pressureNode,
      supplyFlows,
      openIncidentCount,
      coordinationOpenCount,
      blockingTaskCount,
      predAgg,
      memAgg,
      operationalMetrics,
      commandSnap,
      orchestrationOpenCount,
      simulationOpenCount,
      scenarioReviewOpenCount,
    ] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: order.buyerOrganizationId },
        select: { country: true, city: true },
      }),
      this.prisma.relationalSectorNode.findFirst({
        where: { relationshipId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, sectorSlug: true, fragilityScore: true, operationalRiskScore: true },
      }),
      this.prisma.relationalSectorNode.aggregate({
        where: { relationshipId },
        _max: { operationalRiskScore: true, fragilityScore: true },
        _count: { _all: true },
      }),
      this.prisma.relationalGeoEconomicZoneCorridor.findFirst({
        where: { relationshipId },
        select: { zoneId: true, zone: { select: { fragilityScore: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.relationalEconomicDependencyNode.findUnique({
        where: { relationshipId },
        select: { id: true, pressureScore: true, fragilityScore: true },
      }),
      this.prisma.relationalSupplyFlowNode.findMany({
        where: { relationshipId, active: true },
        select: { id: true, disruptionRiskScore: true },
        take: 12,
      }),
      this.prisma.relationalFulfillmentIncident.count({
        where: {
          fulfillmentRecord: { relationshipId },
          resolutionStatus: RelationalFulfillmentIncidentResolutionStatus.OPEN,
        },
      }),
      this.prisma.relationalFulfillmentTask.count({
        where: {
          relationshipId,
          taskStatus: {
            in: [
              RelationalFulfillmentTaskStatus.OPEN,
              RelationalFulfillmentTaskStatus.IN_PROGRESS,
              RelationalFulfillmentTaskStatus.WAITING_EXTERNAL_CONFIRMATION,
              RelationalFulfillmentTaskStatus.WAITING_CORRIDOR_VALIDATION,
            ],
          },
        },
      }),
      this.prisma.relationalFulfillmentTask.count({
        where: {
          relationshipId,
          OR: [{ blockingFulfillment: true }, { taskStatus: RelationalFulfillmentTaskStatus.BLOCKED }],
        },
      }),
      this.prisma.relationalPredictiveRiskSignal.aggregate({
        where: { relationshipId, resolvedAt: null },
        _avg: { signalScore: true },
        _count: { _all: true },
      }),
      this.prisma.relationalStrategicMemory.aggregate({
        where: { relationshipId, memoryStatus: RelationalStrategicMemoryStatus.ACTIVE },
        _avg: { confidenceLevel: true },
        _count: { _all: true },
      }),
      this.prisma.relationalOperationalMetric.findMany({
        where: { relationshipId },
        orderBy: { computedAt: "desc" },
        take: 24,
        select: { metricValue: true },
      }),
      this.prisma.relationalEconomicCommandCenterSnapshot.findFirst({
        where: { relationshipId },
        orderBy: { computedAt: "desc" },
        select: { globalRiskScore: true, systemicPressureScore: true },
      }),
      this.prisma.relationalOperationalOrchestration.count({
        where: {
          relationshipId,
          status: { in: ["ACTIVE", "WAITING_VALIDATION", "PAUSED"] },
        },
      }),
      this.prisma.relationalOperationalSimulation.count({
        where: { relationshipId, status: { in: ["DRAFT", "RUNNING"] } },
      }),
      this.prisma.relationalScenarioReviewBoard.count({
        where: { relationshipId, reviewStatus: { in: ["PENDING_REVIEW", "UNDER_ANALYSIS"] } },
      }),
    ]);

    if (!pressureNode) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("economic_pressure_node_missing");
    }
    if (supplyFlows.length === 0) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("no_active_supply_flow_nodes");
    }
    if (!zoneLink?.zoneId) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("geo_zone_corridor_unlinked");
    }

    const peerPressureEdgeCount = pressureNode
      ? await this.prisma.relationalEconomicDependencyEdge.count({
          where: {
            status: RelationalEconomicDependencyStatus.ACTIVE,
            OR: [{ sourceNodeId: pressureNode.id }, { targetNodeId: pressureNode.id }],
          },
        })
      : 0;

    const supplyFlowDisruptionAvg =
      supplyFlows.length === 0
        ? 0
        : supplyFlows.reduce((s, f) => s + f.disruptionRiskScore, 0) / supplyFlows.length;

    const operationalMetricsUsed = operationalMetrics.length;
    const operationalMetricStress =
      operationalMetricsUsed === 0
        ? 0
        : this.policy.clampInt(
            operationalMetrics.reduce((acc, m) => acc + Math.min(100, Math.abs(m.metricValue)), 0) /
              operationalMetricsUsed,
          );

    return {
      relationshipId,
      hasOrder: true,
      buyerOrganizationId: order.buyerOrganizationId,
      sellerOrganizationId: order.sellerOrganizationId,
      territoryCountry: (buyerOrg?.country ?? "UN").slice(0, 120),
      territoryCity: (buyerOrg?.city ?? "UN").slice(0, 200),
      sectorNodeId: sectorRow?.id ?? null,
      sectorSlug: sectorRow?.sectorSlug ?? null,
      geoZoneId: zoneLink?.zoneId ?? null,
      economicDependencyNodeId: pressureNode?.id ?? null,
      primarySupplyFlowNodeId: supplyFlows[0]?.id ?? null,
      pressureScore: this.policy.clampInt(pressureNode?.pressureScore ?? 0),
      fragilityScore: this.policy.clampInt(pressureNode?.fragilityScore ?? 0),
      geoFragilityScore: this.policy.clampInt(zoneLink?.zone?.fragilityScore ?? 0),
      sectorOperationalRisk: this.policy.clampInt(
        sectorRow?.operationalRiskScore ?? sectorAgg._max.operationalRiskScore ?? 0,
      ),
      sectorFragility: this.policy.clampInt(sectorRow?.fragilityScore ?? sectorAgg._max.fragilityScore ?? 0),
      supplyFlowDisruptionAvg: this.policy.clampInt(supplyFlowDisruptionAvg),
      supplyFlowNodesUsed: supplyFlows.length,
      sectorNodesUsed: sectorAgg._count._all,
      openIncidentCount,
      coordinationOpenCount,
      blockingTaskCount,
      predictiveUnresolvedCount: predAgg._count._all,
      predictiveUnresolvedAvgScore: predAgg._count._all === 0 ? 0 : predAgg._avg.signalScore ?? 0,
      strategicMemoryActiveCount: memAgg._count._all,
      strategicMemoryAvgConfidence: memAgg._count._all === 0 ? 0 : memAgg._avg.confidenceLevel ?? 0,
      operationalMetricStress,
      operationalMetricsUsed,
      commandCenterStress: this.policy.clampInt(
        commandSnap?.systemicPressureScore ?? commandSnap?.globalRiskScore ?? 0,
      ),
      peerPressureEdgeCount,
      orchestrationOpenCount,
      simulationOpenCount,
      scenarioReviewOpenCount,
      heuristicFallbackUsed,
      fallbackReasons: Array.from(new Set(fallbackReasons)),
    };
  }
}
