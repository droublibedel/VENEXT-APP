import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalMacroEconomicDependencyType } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { MacroEconomicCorridorContext } from "./relational-macro-economic-corridor-context.service";
import type { MacroResilienceScores } from "./relational-macro-economic-resilience.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";

export type MacroDependencyInputs = {
  relationshipId: string;
  resilience: MacroResilienceScores;
  ctx: MacroEconomicCorridorContext;
};

export type ComputedMacroDependency = {
  dependencyStrength: number;
  dependencyProbability: number;
  systemicExposureScore: number;
  collapseTransferScore: number;
  dependencyType: RelationalMacroEconomicDependencyType;
  diagnostics: Prisma.InputJsonValue;
};

@Injectable()
export class RelationalMacroEconomicDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalMacroEconomicPolicyService,
  ) {}

  static computeCorridorDependency(input: MacroDependencyInputs): ComputedMacroDependency {
    const { resilience, ctx } = input;
    const exposureWeight = resilience.dependencyExposure;
    const fragilityWeight = resilience.structuralFragility;
    const pressureWeight = resilience.systemicPressure;
    const supplyWeight = ctx.supplyFlowDisruptionAvg;
    const sectorWeight = ctx.sectorOperationalRisk;
    const peerWeight = Math.min(100, ctx.peerPressureEdgeCount * 2);
    const incidentWeight = Math.min(100, ctx.openIncidentCount * 8);

    const dependencyStrength = Math.round(
      exposureWeight * 0.26 +
        fragilityWeight * 0.21 +
        pressureWeight * 0.17 +
        supplyWeight * 0.13 +
        sectorWeight * 0.09 +
        peerWeight * 0.07 +
        incidentWeight * 0.07,
    );
    const strength = Math.max(0, Math.min(100, dependencyStrength));
    const dependencyProbability = Math.max(
      0.05,
      Math.min(0.95, strength / 100 + (ctx.openIncidentCount > 0 ? 0.04 : 0.02)),
    );
    const systemicExposureScore = Math.min(100, Math.round((pressureWeight + exposureWeight) / 2));
    const collapseTransferScore = Math.min(
      100,
      Math.round(strength * 0.75 + fragilityWeight * 0.25),
    );

    let dependencyType: RelationalMacroEconomicDependencyType =
      RelationalMacroEconomicDependencyType.CORRIDOR_CRITICAL;
    if (ctx.sectorNodeId) dependencyType = RelationalMacroEconomicDependencyType.SECTOR_ANCHORED;
    if (ctx.geoZoneId && !ctx.sectorNodeId) {
      dependencyType = RelationalMacroEconomicDependencyType.TERRITORY_ANCHORED;
    }
    if (ctx.primarySupplyFlowNodeId) {
      dependencyType = RelationalMacroEconomicDependencyType.SUPPLY_FLOW_COUPLED;
    }
    if (ctx.peerPressureEdgeCount >= 3) {
      dependencyType = RelationalMacroEconomicDependencyType.PRESSURE_PEER;
    }
    if (resilience.structuralFragility >= 72) {
      dependencyType = RelationalMacroEconomicDependencyType.CONCENTRATION;
    }

    return {
      dependencyStrength: strength,
      dependencyProbability,
      systemicExposureScore,
      collapseTransferScore,
      dependencyType,
      diagnostics: {
        computedFrom: [
          "dependency_exposure",
          "structural_fragility",
          "systemic_pressure",
          "supply_flow",
          "sector_risk",
          "peer_edges",
          "open_incidents",
        ],
        exposureWeight,
        fragilityWeight,
        pressureWeight,
        supplyWeight,
        sectorWeight,
        peerWeight,
        incidentWeight,
        relationshipId: input.relationshipId,
      },
    };
  }

  async persistAdaptiveDependency(
    primaryMacroNodeId: string,
    secondaryMacroNodeId: string,
    computed: ComputedMacroDependency,
    relationshipId: string,
  ): Promise<void> {
    await this.prisma.relationalMacroEconomicDependency.deleteMany({
      where: {
        OR: [
          { sourceMacroNodeId: primaryMacroNodeId, targetMacroNodeId: secondaryMacroNodeId },
          { sourceMacroNodeId: secondaryMacroNodeId, targetMacroNodeId: primaryMacroNodeId },
        ],
      },
    });
    await this.prisma.relationalMacroEconomicDependency.create({
      data: {
        sourceMacroNodeId: primaryMacroNodeId,
        targetMacroNodeId: secondaryMacroNodeId,
        dependencyType: computed.dependencyType,
        dependencyStrength: computed.dependencyStrength,
        propagationProbability: computed.dependencyProbability,
        systemicExposureScore: computed.systemicExposureScore,
        collapseTransferScore: computed.collapseTransferScore,
        diagnostics: computed.diagnostics,
        metadata: { relationshipId, kind: "corridor_adaptive_pair" } as Prisma.InputJsonValue,
      },
    });
  }
}
