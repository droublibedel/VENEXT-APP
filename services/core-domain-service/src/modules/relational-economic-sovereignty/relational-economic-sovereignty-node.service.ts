import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { EconomicSovereigntyCorridorContext } from "./relational-economic-sovereignty-corridor-context.service";
import type { SovereigntyAutonomyScores } from "./relational-economic-sovereignty-autonomy.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";

@Injectable()
export class RelationalEconomicSovereigntyNodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
  ) {}

  async upsertCorridorSovereigntyPair(
    ctx: EconomicSovereigntyCorridorContext,
    scores: SovereigntyAutonomyScores,
  ): Promise<{ primaryId: string; secondaryId: string }> {
    const primaryCode = `SOVEREIGNTY:${ctx.relationshipId}:PRIMARY_AUTONOMY`;
    const secondaryCode = `SOVEREIGNTY:${ctx.relationshipId}:RESILIENCE_ANCHOR`;

    const diag: Prisma.InputJsonValue = {
      engine: "relational_economic_sovereignty.node",
      scores: scores.diagnostics as Prisma.InputJsonValue,
      partiallyDerived: ctx.heuristicFallbackUsed,
      dataQuality: ctx.heuristicFallbackUsed ? "fallback" : "aggregated",
    };

    const base = {
      relationshipId: ctx.relationshipId,
      continuityNodeId: ctx.primaryContinuityNodeId,
      macroEconomicNodeId: ctx.primaryMacroNodeId,
      supplyFlowNodeId: ctx.primarySupplyFlowNodeId,
      geoZoneId: ctx.geoZoneId,
      sectorNodeId: ctx.sectorNodeId,
      territoryCountry: ctx.territoryCountry.slice(0, 120),
      territoryCity: ctx.territoryCity.slice(0, 200),
      sectorSlug: ctx.sectorSlug?.slice(0, 120) ?? null,
      sovereigntyScore: scores.sovereigntyScore,
      autonomyScore: scores.autonomyScore,
      dependencyExposureScore: scores.dependencyExposureScore,
      dependencyExposureLevel: scores.dependencyExposureLevel,
      dependencyConcentration: scores.dependencyConcentration,
      externalDependencyExposure: scores.externalDependencyExposure,
      resilienceAutonomy: scores.resilienceAutonomy,
      recoveryAutonomy: scores.recoveryAutonomy,
      strategicCaptivityRisk: scores.strategicCaptivityRisk,
      corridorSelfRecoveryProbability: scores.corridorSelfRecoveryProbability,
      dependencyCriticality: scores.dependencyCriticality,
      systemicAutonomyRisk: scores.systemicAutonomyRisk,
      autonomyStatus: scores.autonomyStatus,
      severity: scores.severity,
      diagnostics: diag,
    };

    const primary = await this.prisma.relationalEconomicSovereigntyNode.upsert({
      where: { sovereigntyNodeCode: primaryCode },
      create: { ...base, sovereigntyNodeCode: primaryCode, metadata: {} as Prisma.InputJsonValue },
      update: base,
    });

    const secondary = await this.prisma.relationalEconomicSovereigntyNode.upsert({
      where: { sovereigntyNodeCode: secondaryCode },
      create: {
        ...base,
        sovereigntyNodeCode: secondaryCode,
        resilienceAutonomy: this.policy.clampInt(scores.resilienceAutonomy + 6),
        autonomyScore: this.policy.clampInt(scores.autonomyScore - 4),
        metadata: { role: "resilience_anchor" } as Prisma.InputJsonValue,
      },
      update: {
        ...base,
        resilienceAutonomy: this.policy.clampInt(scores.resilienceAutonomy + 6),
        autonomyScore: this.policy.clampInt(scores.autonomyScore - 4),
        diagnostics: diag,
      },
    });

    return { primaryId: primary.id, secondaryId: secondary.id };
  }
}
