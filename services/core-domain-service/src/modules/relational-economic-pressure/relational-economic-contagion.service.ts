/**
 * Instruction 20.21 — bounded BFS contagion projection across dependency edges.
 */
import { Injectable } from "@nestjs/common";

import { RelationalEconomicPressurePolicyService } from "./relational-economic-pressure-policy.service";

export type PressureEdgeLite = {
  sourceNodeId: string;
  targetNodeId: string;
  pressureContribution: number;
  propagationProbability: number;
};

@Injectable()
export class RelationalEconomicContagionService {
  constructor(private readonly policy: RelationalEconomicPressurePolicyService) {}

  projectContagionSpread(adj: Map<string, string[]>, startId: string, maxDepth: number): string[][] {
    const out: string[][] = [];
    const queue: Array<{ id: string; path: string[] }> = [{ id: startId, path: [startId] }];
    const seen = new Set<string>();
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur.path.length > maxDepth + 1) continue;
      if (cur.path.length > 1) out.push([...cur.path]);
      if (cur.path.length > maxDepth) continue;
      const nbrs = adj.get(cur.id) ?? [];
      for (const n of nbrs) {
        const key = `${cur.id}->${n}`;
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push({ id: n, path: [...cur.path, n] });
      }
    }
    return out.slice(0, 80);
  }

  detectCascadeDependency(paths: string[][], thresholdLen = 4): boolean {
    return paths.some((p) => p.length >= thresholdLen);
  }

  estimateRegionalImpact(pathCount: number, avgWeight: number): number {
    return this.policy.clampInt(pathCount * 3 + avgWeight);
  }

  computePropagationIntensity(paths: string[][], weights: Map<string, number>): number {
    if (!paths.length) return 0;
    let sum = 0;
    for (const p of paths) {
      let w = 0;
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i]!;
        const b = p[i + 1]!;
        w += weights.get(`${a}:${b}`) ?? weights.get(`${b}:${a}`) ?? 0;
      }
      sum += w;
    }
    return this.policy.clampInt(sum / Math.max(1, paths.length));
  }

  buildAdjacency(edges: PressureEdgeLite[]): Map<string, string[]> {
    const m = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!m.has(e.sourceNodeId)) m.set(e.sourceNodeId, new Set());
      if (!m.has(e.targetNodeId)) m.set(e.targetNodeId, new Set());
      m.get(e.sourceNodeId)!.add(e.targetNodeId);
      m.get(e.targetNodeId)!.add(e.sourceNodeId);
    }
    const out = new Map<string, string[]>();
    for (const [k, v] of m) out.set(k, [...v]);
    return out;
  }

  buildPressurePropagationMap(input: {
    startNodeId: string;
    edges: PressureEdgeLite[];
  }): { paths: string[][]; intensity: number } {
    const adj = this.buildAdjacency(input.edges);
    const maxDepth = this.policy.maxContagionDepth();
    const paths = this.projectContagionSpread(adj, input.startNodeId, maxDepth);
    const w = new Map<string, number>();
    for (const e of input.edges) {
      w.set(
        `${e.sourceNodeId}:${e.targetNodeId}`,
        this.policy.clampInt(e.pressureContribution * e.propagationProbability),
      );
    }
    const intensity = this.computePropagationIntensity(paths, w);
    return { paths, intensity };
  }
}
