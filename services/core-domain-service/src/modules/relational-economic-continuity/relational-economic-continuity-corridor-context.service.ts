import { Injectable } from "@nestjs/common";
import { RelationalMacroEconomicEventType } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalMacroEconomicCorridorContextService } from "../relational-macro-economic/relational-macro-economic-corridor-context.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";

export type EconomicContinuityCorridorContext = {
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
  pressureScore: number;
  fragilityScore: number;
  geoFragilityScore: number;
  sectorOperationalRisk: number;
  sectorFragility: number;
  supplyFlowDisruptionAvg: number;
  macroResilienceScore: number;
  macroStructuralFragility: number;
  macroPropagationRisk: number;
  macroEconomicStress: number;
  openIncidentCount: number;
  strategicMemoryActiveCount: number;
  strategicMemoryAvgConfidence: number;
  commandCenterStress: number;
  peerPressureEdgeCount: number;
  macroSnapshotCount: number;
  continuitySnapshotCount: number;
  macroPropagationEventCount: number;
  snapshotResilienceTrend: number;
  heuristicFallbackUsed: boolean;
  fallbackReasons: string[];
};

@Injectable()
export class RelationalEconomicContinuityCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicContinuityPolicyService,
    private readonly macroContext: RelationalMacroEconomicCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<EconomicContinuityCorridorContext> {
    const base = await this.macroContext.load(relationshipId);
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
        pressureScore: 0,
        fragilityScore: 0,
        geoFragilityScore: 0,
        sectorOperationalRisk: 0,
        sectorFragility: 0,
        supplyFlowDisruptionAvg: 0,
        macroResilienceScore: 0,
        macroStructuralFragility: 0,
        macroPropagationRisk: 0,
        macroEconomicStress: 0,
        openIncidentCount: 0,
        strategicMemoryActiveCount: 0,
        strategicMemoryAvgConfidence: 0,
        commandCenterStress: 0,
        peerPressureEdgeCount: 0,
        macroSnapshotCount: 0,
        continuitySnapshotCount: 0,
        macroPropagationEventCount: 0,
        snapshotResilienceTrend: 0,
        heuristicFallbackUsed: true,
        fallbackReasons: ["no_order_for_corridor"],
      };
    }

    const fallbackReasons = [...base.fallbackReasons];
    let heuristicFallbackUsed = base.heuristicFallbackUsed;

    const [macroPrimary, macroSnapshots, continuitySnapshots, propagationEvents] = await Promise.all([
      this.prisma.relationalMacroEconomicNode.findFirst({
        where: {
          relationshipId,
          macroNodeCode: `MACRO:${relationshipId}:PRIMARY_RESILIENCE`,
        },
        select: {
          id: true,
          resilienceScore: true,
          structuralFragility: true,
          propagationRisk: true,
          economicStress: true,
        },
      }),
      this.prisma.relationalMacroEconomicResilienceSnapshot.findMany({
        where: { relationshipId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { resilienceScore: true, createdAt: true },
      }),
      this.prisma.relationalEconomicContinuitySnapshot.findMany({
        where: { relationshipId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { continuityScore: true },
      }),
      this.prisma.relationalMacroEconomicEvent.count({
        where: {
          relationshipId,
          eventType: RelationalMacroEconomicEventType.PROPAGATION_DETECTED,
        },
      }),
    ]);

    if (!macroPrimary) {
      heuristicFallbackUsed = true;
      fallbackReasons.push("macro_primary_node_missing");
    }

    let snapshotResilienceTrend = 0;
    if (macroSnapshots.length >= 2) {
      snapshotResilienceTrend = macroSnapshots[0]!.resilienceScore - macroSnapshots[1]!.resilienceScore;
    } else if (continuitySnapshots.length >= 2) {
      snapshotResilienceTrend = continuitySnapshots[0]!.continuityScore - continuitySnapshots[1]!.continuityScore;
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
      primaryMacroNodeId: macroPrimary?.id ?? null,
      pressureScore: base.pressureScore,
      fragilityScore: base.fragilityScore,
      geoFragilityScore: base.geoFragilityScore,
      sectorOperationalRisk: base.sectorOperationalRisk,
      sectorFragility: base.sectorFragility,
      supplyFlowDisruptionAvg: base.supplyFlowDisruptionAvg,
      macroResilienceScore: this.policy.clampInt(macroPrimary?.resilienceScore ?? 0),
      macroStructuralFragility: this.policy.clampInt(macroPrimary?.structuralFragility ?? 0),
      macroPropagationRisk: this.policy.clampInt(macroPrimary?.propagationRisk ?? 0),
      macroEconomicStress: this.policy.clampInt(macroPrimary?.economicStress ?? 0),
      openIncidentCount: base.openIncidentCount,
      strategicMemoryActiveCount: base.strategicMemoryActiveCount,
      strategicMemoryAvgConfidence: base.strategicMemoryAvgConfidence,
      commandCenterStress: base.commandCenterStress,
      peerPressureEdgeCount: base.peerPressureEdgeCount,
      macroSnapshotCount: macroSnapshots.length,
      continuitySnapshotCount: continuitySnapshots.length,
      macroPropagationEventCount: propagationEvents,
      snapshotResilienceTrend: this.policy.clampInt(snapshotResilienceTrend, -100, 100),
      heuristicFallbackUsed,
      fallbackReasons: Array.from(new Set(fallbackReasons)),
    };
  }
}
