import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalSupplyFlowPressureLevel,
  RelationalSupplyFlowRiskLevel,
  RelationalSupplyFlowType,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";

export type FlowNodeUpsertContext = {
  relationshipId: string;
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  sectorNodeId: string | null;
  geoZoneId: string | null;
  territoryCountry: string;
  territoryCity: string;
  /** Indexed category slug (aligned with dominant product flow when available). */
  productCategory: string;
  productFlowCategories: { category: string; relationalVolume: number }[];
  dominantProductCategory: string;
  volumeConfidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  predictiveSignalsUsed: number;
  strategicMemoriesUsed: number;
  operationalMetricsUsed: number;
  heuristicFallbackUsed: boolean;
  fallbackReasons: string[];
  pressureScore: number;
  fragilityScore: number;
  fulfillmentCount: number;
  /** Open fulfillment incidents (resolution OPEN). */
  incidentCount: number;
};

@Injectable()
export class RelationalSupplyFlowNodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalSupplyFlowPolicyService,
  ) {}

  computeContinuityScores(ctx: FlowNodeUpsertContext): {
    flowVolumeScore: number;
    flowStabilityScore: number;
    fulfillmentReliabilityScore: number;
    supplyContinuityScore: number;
    disruptionRiskScore: number;
    dependencyScore: number;
    pressureLevel: RelationalSupplyFlowPressureLevel;
    riskLevel: RelationalSupplyFlowRiskLevel;
  } {
    const p = this.policy.clampInt(ctx.pressureScore);
    const f = this.policy.clampInt(ctx.fragilityScore);
    const fc = Math.min(24, ctx.fulfillmentCount);
    const ic = Math.min(12, ctx.incidentCount);
    const totalVol = ctx.productFlowCategories.reduce((s, c) => s + c.relationalVolume, 0);
    const volSignal =
      ctx.volumeConfidenceLevel === "HIGH"
        ? Math.min(100, Math.round(Math.log1p(totalVol) * 22))
        : ctx.volumeConfidenceLevel === "MEDIUM"
          ? Math.min(95, Math.round(Math.log1p(totalVol) * 16))
          : Math.min(72, Math.round(Math.log1p(totalVol) * 9));
    const flowVolumeScore = this.policy.clampInt(volSignal + fc * 2 - ic * 4);
    const flowStabilityScore = this.policy.clampInt(88 - p * 0.35 - f * 0.25);
    const fulfillmentReliabilityScore = this.policy.clampInt(92 - ic * 7 - p * 0.2);
    const supplyContinuityScore = this.policy.clampInt(
      flowStabilityScore * 0.45 + fulfillmentReliabilityScore * 0.45 + flowVolumeScore * 0.1,
    );
    const disruptionRiskScore = this.policy.clampInt(p * 0.45 + f * 0.35 + ic * 6);
    const dependencyScore = this.policy.clampInt(30 + p * 0.25 + f * 0.2);
    const pressureLevel = this.toPressureLevel(p);
    const riskLevel = this.toRiskLevel(disruptionRiskScore);
    return {
      flowVolumeScore,
      flowStabilityScore,
      fulfillmentReliabilityScore,
      supplyContinuityScore,
      disruptionRiskScore,
      dependencyScore,
      pressureLevel,
      riskLevel,
    };
  }

  private toPressureLevel(score: number): RelationalSupplyFlowPressureLevel {
    if (score < 35) return RelationalSupplyFlowPressureLevel.LOW;
    if (score < 58) return RelationalSupplyFlowPressureLevel.MEDIUM;
    if (score < 78) return RelationalSupplyFlowPressureLevel.HIGH;
    return RelationalSupplyFlowPressureLevel.CRITICAL;
  }

  private toRiskLevel(score: number): RelationalSupplyFlowRiskLevel {
    if (score < 32) return RelationalSupplyFlowRiskLevel.LOW;
    if (score < 55) return RelationalSupplyFlowRiskLevel.MEDIUM;
    if (score < 78) return RelationalSupplyFlowRiskLevel.HIGH;
    return RelationalSupplyFlowRiskLevel.SEVERE;
  }

  async upsertCorridorFlowPair(ctx: FlowNodeUpsertContext): Promise<{ primaryId: string; secondaryId: string }> {
    const scores = this.computeContinuityScores(ctx);
    const primaryCode = `FLOW:${ctx.relationshipId}:PRIMARY_DIRECT`;
    const secondaryCode = `FLOW:${ctx.relationshipId}:SECONDARY_CAPACITY`;

    const dataQuality: "real" | "aggregated" | "fallback" = ctx.heuristicFallbackUsed
      ? "fallback"
      : ctx.volumeConfidenceLevel === "HIGH"
        ? "real"
        : "aggregated";

    const diag: Prisma.InputJsonValue = {
      engine: "relational_supply_flow.node",
      inputs: {
        pressureScore: ctx.pressureScore,
        fragilityScore: ctx.fragilityScore,
        fulfillmentCount: ctx.fulfillmentCount,
        incidentCount: ctx.incidentCount,
      },
      productFlowCategories: ctx.productFlowCategories,
      dominantProductCategory: ctx.dominantProductCategory,
      volumeConfidenceLevel: ctx.volumeConfidenceLevel,
      predictiveSignalsUsed: ctx.predictiveSignalsUsed,
      strategicMemoriesUsed: ctx.strategicMemoriesUsed,
      operationalMetricsUsed: ctx.operationalMetricsUsed,
      heuristicFallbackUsed: ctx.heuristicFallbackUsed,
      fallbackReasons: ctx.fallbackReasons,
      partiallyDerived: ctx.heuristicFallbackUsed,
      dataQuality,
    };

    const primary = await this.prisma.relationalSupplyFlowNode.upsert({
      where: { flowCode: primaryCode },
      create: {
        relationshipId: ctx.relationshipId,
        sectorNodeId: ctx.sectorNodeId,
        geoZoneId: ctx.geoZoneId,
        flowCode: primaryCode,
        flowType: RelationalSupplyFlowType.CORRIDOR_PRODUCT,
        flowName: "Flux corridor principal (observation)",
        sourceOrganizationId: ctx.buyerOrganizationId,
        targetOrganizationId: ctx.sellerOrganizationId,
        productCategory: ctx.productCategory.slice(0, 200),
        territoryCountry: ctx.territoryCountry.slice(0, 120),
        territoryCity: ctx.territoryCity.slice(0, 200),
        ...scores,
        diagnostics: diag,
        metadata: {} as Prisma.InputJsonValue,
      },
      update: {
        sectorNodeId: ctx.sectorNodeId,
        geoZoneId: ctx.geoZoneId,
        flowName: "Flux corridor principal (observation)",
        productCategory: ctx.productCategory.slice(0, 200),
        territoryCountry: ctx.territoryCountry.slice(0, 120),
        territoryCity: ctx.territoryCity.slice(0, 200),
        ...scores,
        diagnostics: diag,
      },
    });

    const secondary = await this.prisma.relationalSupplyFlowNode.upsert({
      where: { flowCode: secondaryCode },
      create: {
        relationshipId: ctx.relationshipId,
        sectorNodeId: ctx.sectorNodeId,
        geoZoneId: ctx.geoZoneId,
        flowCode: secondaryCode,
        flowType: RelationalSupplyFlowType.FULFILLMENT_COUPLING,
        flowName: "Couplage fulfillment analytique",
        sourceOrganizationId: ctx.sellerOrganizationId,
        targetOrganizationId: ctx.buyerOrganizationId,
        productCategory: ctx.productCategory.slice(0, 200),
        territoryCountry: ctx.territoryCountry.slice(0, 120),
        territoryCity: ctx.territoryCity.slice(0, 200),
        ...scores,
        diagnostics: diag,
        metadata: {} as Prisma.InputJsonValue,
      },
      update: {
        sectorNodeId: ctx.sectorNodeId,
        geoZoneId: ctx.geoZoneId,
        productCategory: ctx.productCategory.slice(0, 200),
        territoryCountry: ctx.territoryCountry.slice(0, 120),
        territoryCity: ctx.territoryCity.slice(0, 200),
        ...scores,
        diagnostics: diag,
      },
    });

    return { primaryId: primary.id, secondaryId: secondary.id };
  }
}
