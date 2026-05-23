import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicSovereigntyCorridorContextService } from "../relational-economic-sovereignty/relational-economic-sovereignty-corridor-context.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";

export type EconomicRecoveryCorridorContext = {
  relationshipId: string;
  hasOrder: boolean;
  buyerOrganizationId: string | null;
  sellerOrganizationId: string | null;
  territoryCountry: string;
  territoryCity: string;
  sectorSlug: string | null;
  geoZoneId: string | null;
  primarySovereigntyNodeId: string | null;
  primaryContinuityNodeId: string | null;
  primaryMacroNodeId: string | null;
  primarySupplyFlowNodeId: string | null;
  sovereigntyScore: number;
  autonomyScore: number;
  strategicCaptivityRisk: number;
  dependencyExposureScore: number;
  systemicAutonomyRisk: number;
  corridorSelfRecoveryProbability: number;
  continuityScore: number;
  continuityInstability: number;
  macroStructuralFragility: number;
  macroPropagationRisk: number;
  supplyFlowDisruptionAvg: number;
  pressureScore: number;
  macroDependencyCount: number;
  supplyFlowEdgeCount: number;
  sovereigntyDependencyCount: number;
  continuityDependencyCount: number;
  openIncidentCount: number;
  strategicMemoryActiveCount: number;
  orchestrationOpenCount: number;
  predictiveHighRiskCount: number;
  priorRecoveryPlanCount: number;
  heuristicFallbackUsed: boolean;
  fallbackReasons: string[];
};

@Injectable()
export class RelationalEconomicRecoveryCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicRecoveryPolicyService,
    private readonly sovereigntyContext: RelationalEconomicSovereigntyCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<EconomicRecoveryCorridorContext> {
    const base = await this.sovereigntyContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        relationshipId,
        hasOrder: false,
        buyerOrganizationId: null,
        sellerOrganizationId: null,
        territoryCountry: base.territoryCountry,
        territoryCity: base.territoryCity,
        sectorSlug: null,
        geoZoneId: null,
        primarySovereigntyNodeId: null,
        primaryContinuityNodeId: null,
        primaryMacroNodeId: null,
        primarySupplyFlowNodeId: null,
        sovereigntyScore: 0,
        autonomyScore: 0,
        strategicCaptivityRisk: 0,
        dependencyExposureScore: 0,
        systemicAutonomyRisk: 0,
        corridorSelfRecoveryProbability: 0,
        continuityScore: 0,
        continuityInstability: 0,
        macroStructuralFragility: 0,
        macroPropagationRisk: 0,
        supplyFlowDisruptionAvg: 0,
        pressureScore: 0,
        macroDependencyCount: 0,
        supplyFlowEdgeCount: 0,
        sovereigntyDependencyCount: 0,
        continuityDependencyCount: 0,
        openIncidentCount: 0,
        strategicMemoryActiveCount: 0,
        orchestrationOpenCount: 0,
        predictiveHighRiskCount: 0,
        priorRecoveryPlanCount: 0,
        heuristicFallbackUsed: true,
        fallbackReasons: ["no_order_for_corridor"],
      };
    }

    const fallbackReasons = [...base.fallbackReasons];
    let heuristicFallbackUsed = base.heuristicFallbackUsed;

    const [
      sovereigntyPrimary,
      orchestration,
      memory,
      predictive,
      incidents,
      priorPlans,
      sovereigntyDeps,
      continuityDeps,
    ] = await Promise.all([
      this.prisma.relationalEconomicSovereigntyNode.findFirst({
        where: {
          relationshipId,
          active: true,
          sovereigntyNodeCode: { contains: "PRIMARY_AUTONOMY" },
        },
      }),
      this.prisma.relationalOperationalOrchestration.findFirst({
        where: { relationshipId, status: { in: ["ACTIVE", "WAITING_VALIDATION", "PAUSED"] } },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      }),
      this.prisma.relationalStrategicMemory.count({
        where: { relationshipId, memoryStatus: "ACTIVE" },
      }),
      this.prisma.relationalPredictiveRiskSignal.count({
        where: {
          relationshipId,
          riskLevel: { in: ["HIGH", "CRITICAL"] },
          resolvedAt: null,
        },
      }),
      this.prisma.relationalFulfillmentIncident.count({
        where: {
          fulfillmentRecord: { relationshipId },
          resolutionStatus: "OPEN",
        },
      }),
      this.prisma.relationalEconomicRecoveryPlan.count({ where: { relationshipId, active: true } }),
      this.prisma.relationalEconomicSovereigntyDependency.count({
        where: { sourceNode: { relationshipId } },
      }),
      this.prisma.relationalEconomicContinuityDependency.count({
        where: { sourceNode: { relationshipId } },
      }),
    ]);

    if (!sovereigntyPrimary) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("sovereignty_primary_node_missing");
    }

    return {
      relationshipId,
      hasOrder: true,
      buyerOrganizationId: base.buyerOrganizationId,
      sellerOrganizationId: base.sellerOrganizationId,
      territoryCountry: base.territoryCountry,
      territoryCity: base.territoryCity,
      sectorSlug: base.sectorSlug,
      geoZoneId: base.geoZoneId,
      primarySovereigntyNodeId: sovereigntyPrimary?.id ?? null,
      primaryContinuityNodeId: base.primaryContinuityNodeId,
      primaryMacroNodeId: base.primaryMacroNodeId,
      primarySupplyFlowNodeId: base.primarySupplyFlowNodeId,
      sovereigntyScore: sovereigntyPrimary?.sovereigntyScore ?? 0,
      autonomyScore: sovereigntyPrimary?.autonomyScore ?? 0,
      strategicCaptivityRisk: sovereigntyPrimary?.strategicCaptivityRisk ?? 0,
      dependencyExposureScore: sovereigntyPrimary?.dependencyExposureScore ?? 0,
      systemicAutonomyRisk: sovereigntyPrimary?.systemicAutonomyRisk ?? 0,
      corridorSelfRecoveryProbability: sovereigntyPrimary?.corridorSelfRecoveryProbability ?? 0,
      continuityScore: base.continuityScore,
      continuityInstability: base.continuityInstability,
      macroStructuralFragility: base.macroStructuralFragility,
      macroPropagationRisk: base.macroPropagationRisk,
      supplyFlowDisruptionAvg: base.supplyFlowDisruptionAvg,
      pressureScore: base.pressureScore,
      macroDependencyCount: base.macroDependencyCount,
      supplyFlowEdgeCount: base.supplyFlowEdgeCount,
      sovereigntyDependencyCount: sovereigntyDeps,
      continuityDependencyCount: continuityDeps,
      openIncidentCount: incidents,
      strategicMemoryActiveCount: memory,
      orchestrationOpenCount: orchestration ? 1 : 0,
      predictiveHighRiskCount: predictive,
      priorRecoveryPlanCount: priorPlans,
      heuristicFallbackUsed,
      fallbackReasons: Array.from(new Set(fallbackReasons)),
    };
  }
}
