import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { VENEXT_STABILIZATION_MAX_DEPTH, RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";
import type { EconomicStabilizationCorridorContext } from "./relational-economic-stabilization-corridor-context.service";

export type StabilizationDependencyDraft = {
  dependencyCode: string;
  dependencyWeight: number;
  crossCorridorExposure: number;
  propagationStress: number;
  concentrationScore: number;
  targetRef: string;
};

export type DependencyTraversalDiagnostics = {
  traversalDepth: number;
  visitedCorridors: number;
  boundedTraversalApplied: boolean;
};

@Injectable()
export class RelationalEconomicStabilizationDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicStabilizationPolicyService,
  ) {}

  computeDependencyWeight(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(ctx.dependencyScore * 0.6 + ctx.dependencyExposureScore * 0.4);
  }

  computeCrossCorridorExposure(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(ctx.peerRelationshipCount * 14 + ctx.macroDependencyCount * 8);
  }

  computePropagationStress(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(ctx.macroPropagationRisk * 0.5 + ctx.supplyFlowDisruptionAvg * 0.5);
  }

  computeDependencyConcentration(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(
      ctx.sovereigntyDependencyCount * 10 + ctx.continuityDependencyCount * 10 + ctx.supplyFlowEdgeCount * 5,
    );
  }

  detectCriticalDependencies(ctx: EconomicStabilizationCorridorContext): StabilizationDependencyDraft[] {
    const weight = this.computeDependencyWeight(ctx);
    const exposure = this.computeCrossCorridorExposure(ctx);
    const stress = this.computePropagationStress(ctx);
    const concentration = this.computeDependencyConcentration(ctx);
    const drafts: StabilizationDependencyDraft[] = [
      {
        dependencyCode: `STAB_DEP:macro:${ctx.relationshipId}`,
        dependencyWeight: weight,
        crossCorridorExposure: exposure,
        propagationStress: stress,
        concentrationScore: concentration,
        targetRef: "macro-economic",
      },
    ];
    if (ctx.primarySupplyFlowNodeId) {
      drafts.push({
        dependencyCode: `STAB_DEP:supply:${ctx.relationshipId}`,
        dependencyWeight: this.policy.clampInt(weight * 0.85),
        crossCorridorExposure: this.policy.clampInt(exposure * 0.7),
        propagationStress: this.policy.clampInt(stress * 1.1),
        concentrationScore: concentration,
        targetRef: "supply-flow",
      });
    }
    return drafts;
  }

  async traversePeerCorridors(
    ctx: EconomicStabilizationCorridorContext,
  ): Promise<DependencyTraversalDiagnostics> {
    if (!ctx.buyerOrganizationId) {
      return { traversalDepth: 0, visitedCorridors: 0, boundedTraversalApplied: true };
    }
    const visited = new Set<string>([ctx.relationshipId]);
    const queue: Array<{ relationshipId: string; depth: number }> = [];
    const peers = await this.prisma.relationship.findMany({
      where: {
        id: { not: ctx.relationshipId },
        OR: [
          { requesterOrganizationId: ctx.buyerOrganizationId },
          { receiverOrganizationId: ctx.buyerOrganizationId },
        ],
        corridorState: { not: "TERMINATED" },
      },
      select: { id: true },
      take: VENEXT_STABILIZATION_MAX_DEPTH * 4,
    });
    for (const p of peers) queue.push({ relationshipId: p.id, depth: 1 });
    let maxDepth = 0;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur.depth > VENEXT_STABILIZATION_MAX_DEPTH) continue;
      if (visited.has(cur.relationshipId)) continue;
      visited.add(cur.relationshipId);
      maxDepth = Math.max(maxDepth, cur.depth);
    }
    return {
      traversalDepth: maxDepth,
      visitedCorridors: visited.size,
      boundedTraversalApplied: maxDepth >= VENEXT_STABILIZATION_MAX_DEPTH || peers.length >= VENEXT_STABILIZATION_MAX_DEPTH * 4,
    };
  }
}
