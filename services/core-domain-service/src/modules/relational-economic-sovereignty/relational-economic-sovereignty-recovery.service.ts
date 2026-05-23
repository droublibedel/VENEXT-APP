import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import type { SovereigntyAutonomyScores } from "./relational-economic-sovereignty-autonomy.service";
import { RelationalEconomicSovereigntyCalibrationService } from "./relational-economic-sovereignty-calibration.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";

export type SovereigntyRecoveryDiagnostics = {
  traversalDepth: number;
  visitedNodes: number;
  dependencyTraversalCount: number;
  boundedTraversalApplied: boolean;
  autonomyExposure: number;
  recoveryComplexity: number;
};

@Injectable()
export class RelationalEconomicSovereigntyRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly calibration: RelationalEconomicSovereigntyCalibrationService,
  ) {}

  computeRecoveryAutonomy(
    autonomy: SovereigntyAutonomyScores,
    traversal: SovereigntyRecoveryDiagnostics,
  ): {
    corridorSelfRecoveryProbability: number;
    dependencyRecoveryComplexity: number;
    autonomyRecoveryPressure: number;
  } {
    const rw = this.calibration.getCalibration().recoveryWeights;
    const corridorSelfRecoveryProbability = this.policy.clampProb(
      autonomy.corridorSelfRecoveryProbability * rw.selfRecoveryFromAutonomy +
        (1 - traversal.autonomyExposure / 120) * rw.exposureMitigation -
        traversal.traversalDepth * rw.depthPenalty,
    );
    const dependencyRecoveryComplexity = this.policy.clampInt(
      traversal.recoveryComplexity * rw.complexityFromTraversal +
        autonomy.dependencyCriticality * rw.complexityFromCriticality +
        traversal.dependencyTraversalCount * rw.complexityFromCount,
    );
    const autonomyRecoveryPressure = this.policy.clampInt(
      autonomy.strategicCaptivityRisk * rw.pressureFromCaptivity +
        traversal.autonomyExposure * rw.pressureFromExposure,
    );
    return { corridorSelfRecoveryProbability, dependencyRecoveryComplexity, autonomyRecoveryPressure };
  }

  async buildRecoveryTraversal(relationshipId: string): Promise<{
    recoveryChains: string[][];
    recoveryDiagnostics: SovereigntyRecoveryDiagnostics;
  }> {
    const maxDepth = this.policy.maxSovereigntyDepth();
    const edges = await this.prisma.relationalEconomicSovereigntyDependency.findMany({
      where: { sourceNode: { relationshipId } },
      select: {
        sourceSovereigntyNodeId: true,
        targetSovereigntyNodeId: true,
        captivityTransferScore: true,
      },
      take: 96,
    });

    if (edges.length === 0) {
      return {
        recoveryChains: [],
        recoveryDiagnostics: {
          traversalDepth: 0,
          visitedNodes: 0,
          dependencyTraversalCount: 0,
          boundedTraversalApplied: false,
          autonomyExposure: 0,
          recoveryComplexity: 0,
        },
      };
    }

    const adj = new Map<string, string[]>();
    let maxTransfer = 0;
    for (const e of edges) {
      const arr = adj.get(e.sourceSovereigntyNodeId) ?? [];
      arr.push(e.targetSovereigntyNodeId);
      adj.set(e.sourceSovereigntyNodeId, arr);
      maxTransfer = Math.max(maxTransfer, e.captivityTransferScore);
    }

    const starts = Array.from(new Set(edges.map((e) => e.sourceSovereigntyNodeId)));
    const recoveryChains: string[][] = [];
    let traversalDepth = 0;
    let dependencyTraversalCount = 0;
    let boundedTraversalApplied = false;
    const visitedNodes = new Set<string>();

    const dfs = (path: string[]) => {
      const node = path[path.length - 1]!;
      visitedNodes.add(node);
      const depth = path.length - 1;
      traversalDepth = Math.max(traversalDepth, depth);
      const nbrs = adj.get(node) ?? [];
      if (depth >= maxDepth) {
        recoveryChains.push(path);
        if (nbrs.length > 0) boundedTraversalApplied = true;
        return;
      }
      if (nbrs.length === 0) {
        recoveryChains.push(path);
        return;
      }
      for (const n of nbrs) {
        if (path.includes(n)) continue;
        dependencyTraversalCount += 1;
        dfs([...path, n]);
      }
    };

    for (const s of starts) dfs([s]);

    const autonomyExposure = this.policy.clampInt(
      maxTransfer * 0.55 + traversalDepth * 9 + Math.min(35, recoveryChains.length * 3),
    );
    const recoveryComplexity = this.policy.clampInt(
      autonomyExposure * 0.7 + dependencyTraversalCount * 2,
    );

    return {
      recoveryChains: recoveryChains.slice(0, 32),
      recoveryDiagnostics: {
        traversalDepth,
        visitedNodes: visitedNodes.size,
        dependencyTraversalCount,
        boundedTraversalApplied,
        autonomyExposure,
        recoveryComplexity,
      },
    };
  }
}
