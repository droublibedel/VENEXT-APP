import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicContinuityCorridorContextService } from "../relational-economic-continuity/relational-economic-continuity-corridor-context.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";

export type EconomicSovereigntyCorridorContext = {
  relationshipId: string;
  hasOrder: boolean;
  buyerOrganizationId: string | null;
  sellerOrganizationId: string | null;
  territoryCountry: string;
  territoryCity: string;
  sectorNodeId: string | null;
  sectorSlug: string | null;
  geoZoneId: string | null;
  primarySupplyFlowNodeId: string | null;
  primaryMacroNodeId: string | null;
  primaryContinuityNodeId: string | null;
  continuityScore: number;
  continuityInstability: number;
  continuityRecoveryProbability: number;
  macroResilienceScore: number;
  macroStructuralFragility: number;
  macroPropagationRisk: number;
  supplyFlowDisruptionAvg: number;
  pressureScore: number;
  peerPressureEdgeCount: number;
  openIncidentCount: number;
  strategicMemoryActiveCount: number;
  orchestrationOpenCount: number;
  macroDependencyCount: number;
  supplyFlowEdgeCount: number;
  continuitySnapshotCount: number;
  heuristicFallbackUsed: boolean;
  fallbackReasons: string[];
};

@Injectable()
export class RelationalEconomicSovereigntyCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly continuityContext: RelationalEconomicContinuityCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<EconomicSovereigntyCorridorContext> {
    const base = await this.continuityContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        relationshipId,
        hasOrder: false,
        buyerOrganizationId: null,
        sellerOrganizationId: null,
        territoryCountry: base.territoryCountry,
        territoryCity: base.territoryCity,
        sectorNodeId: null,
        sectorSlug: null,
        geoZoneId: null,
        primarySupplyFlowNodeId: null,
        primaryMacroNodeId: null,
        primaryContinuityNodeId: null,
        continuityScore: 0,
        continuityInstability: 0,
        continuityRecoveryProbability: 0,
        macroResilienceScore: 0,
        macroStructuralFragility: 0,
        macroPropagationRisk: 0,
        supplyFlowDisruptionAvg: 0,
        pressureScore: 0,
        peerPressureEdgeCount: 0,
        openIncidentCount: 0,
        strategicMemoryActiveCount: 0,
        orchestrationOpenCount: 0,
        macroDependencyCount: 0,
        supplyFlowEdgeCount: 0,
        continuitySnapshotCount: 0,
        heuristicFallbackUsed: true,
        fallbackReasons: ["no_order_for_corridor"],
      };
    }

    const fallbackReasons = [...base.fallbackReasons];
    let heuristicFallbackUsed = base.heuristicFallbackUsed;

    const [continuityPrimary, macroDeps, supplyEdges, orchestrationOpenCount] = await Promise.all([
      this.prisma.relationalEconomicContinuityNode.findFirst({
        where: {
          relationshipId,
          continuityNodeCode: `CONTINUITY:${relationshipId}:PRIMARY_STABILITY`,
        },
        select: {
          id: true,
          continuityScore: true,
          instabilityScore: true,
          recoveryProbability: true,
        },
      }),
      this.prisma.relationalMacroEconomicDependency.count({
        where: { sourceNode: { relationshipId } },
      }),
      this.prisma.relationalSupplyFlowEdge.count({
        where: { sourceFlow: { relationshipId } },
      }),
      this.prisma.relationalOperationalOrchestration.count({
        where: {
          relationshipId,
          status: { in: ["ACTIVE", "WAITING_VALIDATION", "PAUSED"] },
        },
      }),
    ]);

    if (!continuityPrimary) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("continuity_primary_node_missing");
    }

    return {
      relationshipId,
      hasOrder: true,
      buyerOrganizationId: base.buyerOrganizationId,
      sellerOrganizationId: base.sellerOrganizationId,
      territoryCountry: base.territoryCountry,
      territoryCity: base.territoryCity,
      sectorNodeId: base.sectorNodeId,
      sectorSlug: base.sectorSlug,
      geoZoneId: base.geoZoneId,
      primarySupplyFlowNodeId: base.primarySupplyFlowNodeId,
      primaryMacroNodeId: base.primaryMacroNodeId,
      primaryContinuityNodeId: continuityPrimary?.id ?? null,
      continuityScore: this.policy.clampInt(continuityPrimary?.continuityScore ?? 0),
      continuityInstability: this.policy.clampInt(continuityPrimary?.instabilityScore ?? 0),
      continuityRecoveryProbability: continuityPrimary?.recoveryProbability ?? 0,
      macroResilienceScore: base.macroResilienceScore,
      macroStructuralFragility: base.macroStructuralFragility,
      macroPropagationRisk: base.macroPropagationRisk,
      supplyFlowDisruptionAvg: base.supplyFlowDisruptionAvg,
      pressureScore: base.pressureScore,
      peerPressureEdgeCount: base.peerPressureEdgeCount,
      openIncidentCount: base.openIncidentCount,
      strategicMemoryActiveCount: base.strategicMemoryActiveCount,
      orchestrationOpenCount,
      macroDependencyCount: macroDeps,
      supplyFlowEdgeCount: supplyEdges,
      continuitySnapshotCount: base.continuitySnapshotCount,
      heuristicFallbackUsed,
      fallbackReasons: Array.from(new Set(fallbackReasons)),
    };
  }
}
