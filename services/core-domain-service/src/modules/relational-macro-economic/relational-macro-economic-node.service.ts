import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { MacroEconomicCorridorContext } from "./relational-macro-economic-corridor-context.service";
import type { MacroResilienceScores } from "./relational-macro-economic-resilience.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";

@Injectable()
export class RelationalMacroEconomicNodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalMacroEconomicPolicyService,
  ) {}

  async upsertCorridorMacroPair(
    ctx: MacroEconomicCorridorContext,
    scores: MacroResilienceScores,
  ): Promise<{ primaryId: string; secondaryId: string }> {
    const primaryCode = `MACRO:${ctx.relationshipId}:PRIMARY_RESILIENCE`;
    const secondaryCode = `MACRO:${ctx.relationshipId}:ADAPTIVE_CAPACITY`;

    const diag: Prisma.InputJsonValue = {
      engine: "relational_macro_economic.node",
      scores: scores.diagnostics as Prisma.InputJsonValue,
      partiallyDerived: ctx.heuristicFallbackUsed,
      dataQuality: ctx.heuristicFallbackUsed ? "fallback" : "aggregated",
    };

    const base = {
      relationshipId: ctx.relationshipId,
      sectorNodeId: ctx.sectorNodeId,
      geoZoneId: ctx.geoZoneId,
      territoryCountry: ctx.territoryCountry.slice(0, 120),
      territoryCity: ctx.territoryCity.slice(0, 200),
      sectorSlug: ctx.sectorSlug?.slice(0, 120) ?? null,
      resilienceScore: scores.resilienceScore,
      structuralFragility: scores.structuralFragility,
      operationalContinuity: scores.operationalContinuity,
      dependencyExposure: scores.dependencyExposure,
      adaptationCapacity: scores.adaptationCapacity,
      systemicPressure: scores.systemicPressure,
      economicStress: scores.economicStress,
      corridorRecoveryProbability: scores.corridorRecoveryProbability,
      macroEconomicRisk: scores.macroEconomicRisk,
      propagationRisk: scores.propagationRisk,
      fragilityScore: scores.fragilityScore,
      resilienceStatus: scores.resilienceStatus,
      riskLevel: scores.riskLevel,
      diagnostics: diag,
    };

    const primary = await this.prisma.relationalMacroEconomicNode.upsert({
      where: { macroNodeCode: primaryCode },
      create: {
        ...base,
        macroNodeCode: primaryCode,
        supplyFlowNodeId: ctx.primarySupplyFlowNodeId,
        economicDependencyNodeId: ctx.economicDependencyNodeId,
        metadata: {} as Prisma.InputJsonValue,
      },
      update: {
        ...base,
        supplyFlowNodeId: ctx.primarySupplyFlowNodeId,
        economicDependencyNodeId: ctx.economicDependencyNodeId,
      },
    });

    const secondary = await this.prisma.relationalMacroEconomicNode.upsert({
      where: { macroNodeCode: secondaryCode },
      create: {
        ...base,
        macroNodeCode: secondaryCode,
        adaptationCapacity: this.policy.clampInt(scores.adaptationCapacity + 4),
        resilienceScore: this.policy.clampInt(scores.resilienceScore - 6),
        metadata: { role: "adaptive_capacity" } as Prisma.InputJsonValue,
      },
      update: {
        ...base,
        adaptationCapacity: this.policy.clampInt(scores.adaptationCapacity + 4),
        resilienceScore: this.policy.clampInt(scores.resilienceScore - 6),
        diagnostics: diag,
      },
    });

    return { primaryId: primary.id, secondaryId: secondary.id };
  }
}
