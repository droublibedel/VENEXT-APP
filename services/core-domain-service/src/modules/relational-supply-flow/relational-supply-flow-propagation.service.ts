import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";

export type FlowPropagationTraversalDiagnostics = {
  cascadeDepth: number;
  visitedNodes: number;
  edgeTraversalCount: number;
  boundedTraversalApplied: boolean;
};

@Injectable()
export class RelationalSupplyFlowPropagationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalSupplyFlowPolicyService,
  ) {}

  async projectFlowDisruptionPropagation(relationshipId: string): Promise<{
    cascadePaths: string[][];
    maxDepthObserved: number;
    traversalDiagnostics: FlowPropagationTraversalDiagnostics;
  }> {
    const maxDepth = this.policy.maxPropagationDepth();
    const edges = await this.prisma.relationalSupplyFlowEdge.findMany({
      where: {
        sourceFlow: { relationshipId },
      },
      select: { sourceFlowId: true, targetFlowId: true },
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
        },
      };
    }

    const adj = new Map<string, string[]>();
    for (const e of edges) {
      const arr = adj.get(e.sourceFlowId) ?? [];
      arr.push(e.targetFlowId);
      adj.set(e.sourceFlowId, arr);
    }

    const starts = Array.from(new Set(edges.map((e) => e.sourceFlowId)));
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

    for (const s of starts) {
      dfs([s]);
    }

    return {
      cascadePaths: cascadePaths.slice(0, 32),
      maxDepthObserved,
      traversalDiagnostics: {
        cascadeDepth: maxDepthObserved,
        visitedNodes: visitedNodes.size,
        edgeTraversalCount,
        boundedTraversalApplied,
      },
    };
  }

  detectSupplyCascade(paths: string[][]): number {
    return paths.reduce((m, p) => Math.max(m, p.length), 0);
  }

  estimateDownstreamImpact(paths: string[][]): number {
    if (paths.length === 0) return 0;
    return this.policy.clampInt(paths.reduce((s, p) => s + p.length * 12, 0) / paths.length);
  }

  async buildFlowPropagationMap(relationshipId: string): Promise<{
    cascadePaths: string[][];
    maxDepthObserved: number;
    downstreamImpact: number;
    traversalDiagnostics: FlowPropagationTraversalDiagnostics;
  }> {
    const { cascadePaths, maxDepthObserved, traversalDiagnostics } = await this.projectFlowDisruptionPropagation(
      relationshipId,
    );
    const downstreamImpact = this.estimateDownstreamImpact(cascadePaths);
    return { cascadePaths, maxDepthObserved, downstreamImpact, traversalDiagnostics };
  }
}
