import { Injectable } from "@nestjs/common";

import { RelationalEconomicDependencyService } from "../relational-economic-pressure/relational-economic-dependency.service";
import { RelationalGeoEconomicPolicyService } from "./relational-geo-economic-policy.service";

export type PropagationPath = { path: string[]; territorialImpactScore: number };

/**
 * Instruction 20.22 — bounded BFS over dependency topology as regional propagation proxy.
 */
@Injectable()
export class RelationalGeoEconomicPropagationService {
  constructor(
    private readonly policy: RelationalGeoEconomicPolicyService,
    private readonly dependency: RelationalEconomicDependencyService,
  ) {}

  async projectRegionalPropagation(relationshipId: string): Promise<{
    cascadePaths: PropagationPath[];
    maxDepthObserved: number;
  }> {
    const maxDepth = this.policy.maxPropagationDepth();
    const cascadePaths: PropagationPath[] = [];
    const queue: { id: string; depth: number; path: string[] }[] = [
      { id: relationshipId, depth: 0, path: [relationshipId] },
    ];
    const visitedBest = new Map<string, number>();

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const prev = visitedBest.get(cur.id);
      if (prev != null && prev <= cur.depth) continue;
      visitedBest.set(cur.id, cur.depth);

      if (cur.depth >= maxDepth) continue;

      const peers = await this.dependency.detectDependencyRelationships(cur.id);
      for (const p of peers) {
        if (cur.path.includes(p)) continue;
        const nextPath = [...cur.path, p];
        const territorialImpactScore = this.policy.clampInt(
          nextPath.length * 16 + Math.min(40, peers.length * 3),
        );
        cascadePaths.push({ path: nextPath, territorialImpactScore });
        if (cur.depth + 1 < maxDepth) {
          queue.push({ id: p, depth: cur.depth + 1, path: nextPath });
        }
      }
    }

    const maxDepthObserved = cascadePaths.reduce((m, p) => Math.max(m, p.path.length - 1), 0);
    return { cascadePaths: cascadePaths.slice(0, 96), maxDepthObserved };
  }

  async detectRegionalCascade(relationshipId: string): Promise<PropagationPath[]> {
    const { cascadePaths } = await this.projectRegionalPropagation(relationshipId);
    return cascadePaths.filter((p) => p.path.length >= 3).slice(0, 40);
  }

  computeZoneExposure(input: { corridorCount: number; systemicExposureScore: number; fragilityScore: number }): number {
    return this.policy.clampInt(
      input.systemicExposureScore * 0.62 + input.fragilityScore * 0.28 + input.corridorCount * 1.4,
    );
  }

  estimateTerritorialImpact(path: PropagationPath): number {
    return this.policy.clampInt(path.territorialImpactScore + path.path.length * 4);
  }
}
