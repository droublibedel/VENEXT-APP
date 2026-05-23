import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";

export type MacroPropagationTraversalDiagnostics = {
  cascadeDepth: number;
  visitedNodes: number;
  edgeTraversalCount: number;
  boundedTraversalApplied: boolean;
  collapseExposure: number;
};

@Injectable()
export class RelationalMacroEconomicPropagationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalMacroEconomicPolicyService,
  ) {}

  async buildPropagationMap(relationshipId: string): Promise<{
    cascadePaths: string[][];
    maxDepthObserved: number;
    traversalDiagnostics: MacroPropagationTraversalDiagnostics;
  }> {
    const maxDepth = this.policy.maxPropagationDepth();
    const edges = await this.prisma.relationalMacroEconomicDependency.findMany({
      where: { sourceNode: { relationshipId } },
      select: { sourceMacroNodeId: true, targetMacroNodeId: true, collapseTransferScore: true },
      take: 96,
    });

    if (edges.length === 0) {
      return {
        cascadePaths: [],
        maxDepthObserved: 0,
        traversalDiagnostics: {
          cascadeDepth: 0,
          visitedNodes: 0,
          edgeTraversalCount: 0,
          boundedTraversalApplied: false,
          collapseExposure: 0,
        },
      };
    }

    const adj = new Map<string, string[]>();
    let maxCollapse = 0;
    for (const e of edges) {
      const arr = adj.get(e.sourceMacroNodeId) ?? [];
      arr.push(e.targetMacroNodeId);
      adj.set(e.sourceMacroNodeId, arr);
      maxCollapse = Math.max(maxCollapse, e.collapseTransferScore);
    }

    const starts = Array.from(new Set(edges.map((e) => e.sourceMacroNodeId)));
    const cascadePaths: string[][] = [];
    let maxDepthObserved = 0;
    let edgeTraversalCount = 0;
    let boundedTraversalApplied = false;
    const visitedNodes = new Set<string>();

    const dfs = (path: string[]) => {
      const node = path[path.length - 1]!;
      visitedNodes.add(node);
      const depth = path.length - 1;
      maxDepthObserved = Math.max(maxDepthObserved, depth);
      const nbrs = adj.get(node) ?? [];
      if (depth >= maxDepth) {
        cascadePaths.push(path);
        if (nbrs.length > 0) boundedTraversalApplied = true;
        return;
      }
      if (nbrs.length === 0) {
        cascadePaths.push(path);
        return;
      }
      for (const n of nbrs) {
        if (path.includes(n)) continue;
        edgeTraversalCount += 1;
        dfs([...path, n]);
      }
    };

    for (const s of starts) dfs([s]);

    const collapseExposure = this.policy.clampInt(
      maxCollapse * 0.6 + maxDepthObserved * 8 + Math.min(40, cascadePaths.length * 3),
    );

    return {
      cascadePaths: cascadePaths.slice(0, 32),
      maxDepthObserved,
      traversalDiagnostics: {
        cascadeDepth: maxDepthObserved,
        visitedNodes: visitedNodes.size,
        edgeTraversalCount,
        boundedTraversalApplied,
        collapseExposure,
      },
    };
  }
}
