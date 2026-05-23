import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import type { ContinuityStabilityScores } from "./relational-economic-continuity-stability.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";

export type ContinuityRecoveryDiagnostics = {
  traversalDepth: number;
  visitedNodes: number;
  edgeTraversalCount: number;
  recoveryBounded: boolean;
  impactedCorridors: number;
  continuityExposure: number;
};

@Injectable()
export class RelationalEconomicContinuityRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicContinuityPolicyService,
  ) {}

  computeRecoveryProjection(stability: ContinuityStabilityScores, traversal: ContinuityRecoveryDiagnostics): {
    corridorRecoveryProbability: number;
    recoveryDurationEstimateDays: number;
    continuityRecoveryPressure: number;
    systemicRecoveryComplexity: number;
  } {
    const corridorRecoveryProbability = this.policy.clampProb(
      stability.recoveryProbability * 0.7 +
        (1 - traversal.continuityExposure / 120) * 0.2 -
        traversal.traversalDepth / 80,
    );
    const recoveryDurationEstimateDays = Math.min(
      3650,
      Math.max(
        1,
        Math.round(
          (100 - stability.continuityScore) * 2 +
            traversal.traversalDepth * 5 +
            traversal.impactedCorridors * 3,
        ),
      ),
    );
    const continuityRecoveryPressure = this.policy.clampInt(
      stability.continuityPressure * 0.5 + traversal.continuityExposure * 0.35 + (100 - stability.continuityScore) * 0.15,
    );
    const systemicRecoveryComplexity = this.policy.clampInt(
      stability.systemicContinuityRisk * 0.45 +
        traversal.traversalDepth * 6 +
        traversal.impactedCorridors * 4,
    );
    return {
      corridorRecoveryProbability,
      recoveryDurationEstimateDays,
      continuityRecoveryPressure,
      systemicRecoveryComplexity,
    };
  }

  async buildRecoveryMap(relationshipId: string): Promise<{
    recoveryChains: string[][];
    recoveryDiagnostics: ContinuityRecoveryDiagnostics;
  }> {
    const maxDepth = this.policy.maxRecoveryDepth();
    const edges = await this.prisma.relationalEconomicContinuityDependency.findMany({
      where: { sourceNode: { relationshipId } },
      select: {
        sourceContinuityNodeId: true,
        targetContinuityNodeId: true,
        continuityTransferScore: true,
      },
      take: 96,
    });

    if (edges.length === 0) {
      return {
        recoveryChains: [],
        recoveryDiagnostics: {
          traversalDepth: 0,
          visitedNodes: 0,
          edgeTraversalCount: 0,
          recoveryBounded: false,
          impactedCorridors: 0,
          continuityExposure: 0,
        },
      };
    }

    const adj = new Map<string, string[]>();
    let maxTransfer = 0;
    for (const e of edges) {
      const arr = adj.get(e.sourceContinuityNodeId) ?? [];
      arr.push(e.targetContinuityNodeId);
      adj.set(e.sourceContinuityNodeId, arr);
      maxTransfer = Math.max(maxTransfer, e.continuityTransferScore);
    }

    const starts = Array.from(new Set(edges.map((e) => e.sourceContinuityNodeId)));
    const recoveryChains: string[][] = [];
    let traversalDepth = 0;
    let edgeTraversalCount = 0;
    let recoveryBounded = false;
    const visitedNodes = new Set<string>();

    const dfs = (path: string[]) => {
      const node = path[path.length - 1]!;
      visitedNodes.add(node);
      const depth = path.length - 1;
      traversalDepth = Math.max(traversalDepth, depth);
      const nbrs = adj.get(node) ?? [];
      if (depth >= maxDepth) {
        recoveryChains.push(path);
        if (nbrs.length > 0) recoveryBounded = true;
        return;
      }
      if (nbrs.length === 0) {
        recoveryChains.push(path);
        return;
      }
      for (const n of nbrs) {
        if (path.includes(n)) continue;
        edgeTraversalCount += 1;
        dfs([...path, n]);
      }
    };

    for (const s of starts) dfs([s]);

    const continuityExposure = this.policy.clampInt(
      maxTransfer * 0.55 + traversalDepth * 9 + Math.min(35, recoveryChains.length * 3),
    );

    return {
      recoveryChains: recoveryChains.slice(0, 32),
      recoveryDiagnostics: {
        traversalDepth,
        visitedNodes: visitedNodes.size,
        edgeTraversalCount,
        recoveryBounded,
        impactedCorridors: visitedNodes.size,
        continuityExposure,
      },
    };
  }
}
