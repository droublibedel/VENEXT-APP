import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { EconomicContinuityCorridorContext } from "./relational-economic-continuity-corridor-context.service";
import type { ContinuityStabilityScores } from "./relational-economic-continuity-stability.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";

@Injectable()
export class RelationalEconomicContinuityNodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicContinuityPolicyService,
  ) {}

  async upsertCorridorContinuityPair(
    ctx: EconomicContinuityCorridorContext,
    scores: ContinuityStabilityScores,
  ): Promise<{ primaryId: string; secondaryId: string }> {
    const primaryCode = `CONTINUITY:${ctx.relationshipId}:PRIMARY_STABILITY`;
    const secondaryCode = `CONTINUITY:${ctx.relationshipId}:DURABILITY_ANCHOR`;

    const diag: Prisma.InputJsonValue = {
      engine: "relational_economic_continuity.node",
      scores: scores.diagnostics as Prisma.InputJsonValue,
      partiallyDerived: ctx.heuristicFallbackUsed,
      dataQuality: ctx.heuristicFallbackUsed ? "fallback" : "aggregated",
    };

    const base = {
      relationshipId: ctx.relationshipId,
      macroEconomicNodeId: ctx.primaryMacroNodeId,
      supplyFlowNodeId: ctx.primarySupplyFlowNodeId,
      geoZoneId: ctx.geoZoneId,
      sectorNodeId: ctx.sectorNodeId,
      territoryCountry: ctx.territoryCountry.slice(0, 120),
      territoryCity: ctx.territoryCity.slice(0, 200),
      sectorSlug: ctx.sectorSlug?.slice(0, 120) ?? null,
      continuityScore: scores.continuityScore,
      corridorDurability: scores.corridorDurability,
      economicStability: scores.economicStability,
      instabilityScore: scores.instabilityRisk,
      continuityPressure: scores.continuityPressure,
      dependencyDurability: scores.dependencyDurability,
      economicSurvivalProbability: scores.economicSurvivalProbability,
      recoveryProbability: scores.recoveryProbability,
      systemicContinuityRisk: scores.systemicContinuityRisk,
      continuityStatus: scores.continuityStatus,
      severity: scores.severity,
      diagnostics: diag,
    };

    const primary = await this.prisma.relationalEconomicContinuityNode.upsert({
      where: { continuityNodeCode: primaryCode },
      create: { ...base, continuityNodeCode: primaryCode, metadata: {} as Prisma.InputJsonValue },
      update: base,
    });

    const secondary = await this.prisma.relationalEconomicContinuityNode.upsert({
      where: { continuityNodeCode: secondaryCode },
      create: {
        ...base,
        continuityNodeCode: secondaryCode,
        corridorDurability: this.policy.clampInt(scores.corridorDurability + 5),
        continuityScore: this.policy.clampInt(scores.continuityScore - 5),
        metadata: { role: "durability_anchor" } as Prisma.InputJsonValue,
      },
      update: {
        ...base,
        corridorDurability: this.policy.clampInt(scores.corridorDurability + 5),
        continuityScore: this.policy.clampInt(scores.continuityScore - 5),
        diagnostics: diag,
      },
    });

    return { primaryId: primary.id, secondaryId: secondary.id };
  }
}
