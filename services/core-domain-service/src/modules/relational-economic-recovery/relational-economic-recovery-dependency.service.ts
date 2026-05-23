import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";

export type RecoveryDependencyDiagnostics = {
  traversalDepth: number;
  boundedTraversalApplied: boolean;
  visitedNodes: number;
  recoveryEdgeCount: number;
  recoveryChains: string[][];
  recoveryBottlenecks: string[];
  recoveryBlockers: string[];
};

@Injectable()
export class RelationalEconomicRecoveryDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicRecoveryPolicyService,
  ) {}

  async buildRecoveryDependencyMap(relationshipId: string): Promise<RecoveryDependencyDiagnostics> {
    const maxDepth = this.policy.maxRecoveryDepth();
    const edges = await this.prisma.relationalEconomicSovereigntyDependency.findMany({
      where: { sourceNode: { relationshipId } },
      select: { sourceSovereigntyNodeId: true, targetSovereigntyNodeId: true, captivityTransferScore: true },
      take: 96,
    });

    if (edges.length === 0) {
      return {
        traversalDepth: 0,
        boundedTraversalApplied: false,
        visitedNodes: 0,
        recoveryEdgeCount: 0,
        recoveryChains: [],
        recoveryBottlenecks: [],
        recoveryBlockers: [],
      };
    }

    const adj = new Map<string, string[]>();
    const bottlenecks: string[] = [];
    for (const e of edges) {
      const arr = adj.get(e.sourceSovereigntyNodeId) ?? [];
      arr.push(e.targetSovereigntyNodeId);
      adj.set(e.sourceSovereigntyNodeId, arr);
      if (e.captivityTransferScore >= 70) {
        bottlenecks.push(e.targetSovereigntyNodeId);
      }
    }

    const starts = Array.from(new Set(edges.map((e) => e.sourceSovereigntyNodeId)));
    const recoveryChains: string[][] = [];
    let traversalDepth = 0;
    let recoveryEdgeCount = 0;
    let boundedTraversalApplied = false;
    const visited = new Set<string>();

    const dfs = (path: string[]) => {
      const node = path[path.length - 1]!;
      visited.add(node);
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
        recoveryEdgeCount += 1;
        dfs([...path, n]);
      }
    };

    for (const s of starts) dfs([s]);

    return {
      traversalDepth,
      boundedTraversalApplied,
      visitedNodes: visited.size,
      recoveryEdgeCount,
      recoveryChains: recoveryChains.slice(0, 32),
      recoveryBottlenecks: bottlenecks.slice(0, 16),
      recoveryBlockers: bottlenecks.filter((id) => !visited.has(id)).slice(0, 8),
    };
  }
}
