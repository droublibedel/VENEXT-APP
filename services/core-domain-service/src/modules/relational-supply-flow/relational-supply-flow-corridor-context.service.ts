import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicDependencyStatus,
  RelationalFulfillmentIncidentResolutionStatus,
  RelationalFulfillmentTaskStatus,
  RelationalStrategicMemoryStatus,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";

export type ProductFlowCategoryRow = { category: string; relationalVolume: number };

export type CorridorSupplyFlowMaterializationContext = {
  relationshipId: string;
  hasOrder: boolean;
  orderId: string | null;
  buyerOrganizationId: string | null;
  sellerOrganizationId: string | null;
  territoryCountry: string;
  territoryCity: string;
  sectorNodeId: string | null;
  geoZoneId: string | null;
  productFlowCategories: ProductFlowCategoryRow[];
  dominantProductCategory: string;
  volumeConfidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  heuristicFallbackUsed: boolean;
  fallbackReasons: string[];
  openIncidentCount: number;
  coordinationOpenCount: number;
  blockingFulfillmentTaskCount: number;
  pressureScore: number;
  fragilityScore: number;
  geoFragilityScore: number;
  sectorMaxOperationalRisk: number;
  predictiveUnresolvedCount: number;
  predictiveUnresolvedAvgScore: number;
  strategicMemoryActiveCount: number;
  strategicMemoryAvgConfidence: number;
  operationalMetricStress: number;
  operationalMetricsUsed: number;
  peerCorridorEdgeCount: number;
};

/**
 * Instruction 20.24A — shared Prisma reads for supply-flow materialization and read-side diagnostics (no mutations).
 */
@Injectable()
export class RelationalSupplyFlowCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalSupplyFlowPolicyService,
  ) {}

  async load(relationshipId: string): Promise<CorridorSupplyFlowMaterializationContext> {
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
        orderId: null,
        buyerOrganizationId: null,
        sellerOrganizationId: null,
        territoryCountry: "UN",
        territoryCity: "UN",
        sectorNodeId: null,
        geoZoneId: null,
        productFlowCategories: [],
        dominantProductCategory: "UNLABELED",
        volumeConfidenceLevel: "LOW",
        heuristicFallbackUsed: true,
        fallbackReasons: ["no_order_for_corridor"],
        openIncidentCount: 0,
        coordinationOpenCount: 0,
        blockingFulfillmentTaskCount: 0,
        pressureScore: 0,
        fragilityScore: 0,
        geoFragilityScore: 0,
        sectorMaxOperationalRisk: 0,
        predictiveUnresolvedCount: 0,
        predictiveUnresolvedAvgScore: 0,
        strategicMemoryActiveCount: 0,
        strategicMemoryAvgConfidence: 0,
        operationalMetricStress: 0,
        operationalMetricsUsed: 0,
        peerCorridorEdgeCount: 0,
      };
    }

    const [
      buyerOrg,
      orderItems,
      sectorRow,
      sectorAgg,
      zoneLink,
      pressureNode,
      openIncidentCount,
      coordinationOpenCount,
      blockingFulfillmentTaskCount,
      predAgg,
      memAgg,
      operationalMetrics,
    ] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: order.buyerOrganizationId },
        select: { country: true, city: true, category: true },
      }),
      this.prisma.orderItem.findMany({
        where: { orderId: order.id },
        select: { quantity: true, product: { select: { category: true } } },
        take: 200,
      }),
      this.prisma.relationalSectorNode.findFirst({
        where: { relationshipId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      }),
      this.prisma.relationalSectorNode.aggregate({
        where: { relationshipId },
        _max: { operationalRiskScore: true },
      }),
      this.prisma.relationalGeoEconomicZoneCorridor.findFirst({
        where: { relationshipId },
        select: {
          zoneId: true,
          zone: { select: { fragilityScore: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.relationalEconomicDependencyNode.findUnique({
        where: { relationshipId },
        select: { id: true, pressureScore: true, fragilityScore: true },
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
    ]);

    const peerCorridorEdgeCount = pressureNode
      ? await this.prisma.relationalEconomicDependencyEdge.count({
          where: {
            status: RelationalEconomicDependencyStatus.ACTIVE,
            OR: [{ sourceNodeId: pressureNode.id }, { targetNodeId: pressureNode.id }],
          },
        })
      : 0;

    const territoryCountry = (buyerOrg?.country ?? "UN").slice(0, 120);
    const territoryCity = (buyerOrg?.city ?? "UN").slice(0, 200);

    if (!pressureNode) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("economic_pressure_node_missing");
    }
    if (!zoneLink?.zoneId) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("geo_zone_corridor_unlinked");
    }

    const pressureScore = this.policy.clampInt(pressureNode?.pressureScore ?? 0);
    const fragilityScore = this.policy.clampInt(pressureNode?.fragilityScore ?? 0);
    const geoFragilityScore = this.policy.clampInt(zoneLink?.zone?.fragilityScore ?? 0);
    if (!zoneLink?.zone && zoneLink?.zoneId) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("geo_zone_row_missing_fragility");
    }

    const sectorMaxOperationalRisk = sectorAgg._max.operationalRiskScore ?? 0;

    const byCat = new Map<string, number>();
    for (const it of orderItems) {
      const rawCat = it.product?.category?.trim() || "";
      const cat = rawCat.length > 0 ? this.policy.slugify(rawCat) : "UNLABELED";
      const q = Number(it.quantity);
      const add = Number.isFinite(q) ? q : 0;
      byCat.set(cat, (byCat.get(cat) ?? 0) + add);
    }

    const productFlowCategories: ProductFlowCategoryRow[] = Array.from(byCat.entries())
      .map(([category, relationalVolume]) => ({ category, relationalVolume }))
      .sort((a, b) => b.relationalVolume - a.relationalVolume);

    let dominantProductCategory = productFlowCategories[0]?.category ?? "UNLABELED";
    let volumeConfidenceLevel: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    const totalVol = productFlowCategories.reduce((s, r) => s + r.relationalVolume, 0);

    if (orderItems.length === 0) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("no_order_lines");
      dominantProductCategory = this.policy.slugify(buyerOrg?.category ?? "GENERAL");
    } else if (totalVol <= 0) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("order_lines_without_positive_volume");
      dominantProductCategory = this.policy.slugify(buyerOrg?.category ?? "GENERAL");
    } else {
      if (orderItems.length >= 2 && totalVol > 0) volumeConfidenceLevel = "HIGH";
      else volumeConfidenceLevel = "MEDIUM";
    }

    const predictiveUnresolvedCount = predAgg._count._all;
    const predictiveUnresolvedAvgScore = predictiveUnresolvedCount === 0 ? 0 : predAgg._avg.signalScore ?? 0;

    const strategicMemoryActiveCount = memAgg._count._all;
    const strategicMemoryAvgConfidence = strategicMemoryActiveCount === 0 ? 0 : memAgg._avg.confidenceLevel ?? 0;

    const operationalMetricsUsed = operationalMetrics.length;
    const operationalMetricStress =
      operationalMetricsUsed === 0
        ? 0
        : this.policy.clampInt(
            operationalMetrics.reduce((s, m) => s + Math.min(100, Math.abs(m.metricValue)), 0) / operationalMetricsUsed,
          );

    return {
      relationshipId,
      hasOrder: true,
      orderId: order.id,
      buyerOrganizationId: order.buyerOrganizationId,
      sellerOrganizationId: order.sellerOrganizationId,
      territoryCountry,
      territoryCity,
      sectorNodeId: sectorRow?.id ?? null,
      geoZoneId: zoneLink?.zoneId ?? null,
      productFlowCategories,
      dominantProductCategory,
      volumeConfidenceLevel,
      heuristicFallbackUsed,
      fallbackReasons: Array.from(new Set(fallbackReasons)),
      openIncidentCount,
      coordinationOpenCount,
      blockingFulfillmentTaskCount,
      pressureScore,
      fragilityScore,
      geoFragilityScore,
      sectorMaxOperationalRisk,
      predictiveUnresolvedCount,
      predictiveUnresolvedAvgScore,
      strategicMemoryActiveCount,
      strategicMemoryAvgConfidence,
      operationalMetricStress,
      operationalMetricsUsed,
      peerCorridorEdgeCount,
    };
  }
}
