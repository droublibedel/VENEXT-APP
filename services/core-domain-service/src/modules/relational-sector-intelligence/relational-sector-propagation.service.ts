import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalSectorPolicyService } from "./relational-sector-policy.service";

export type SectorPropagationPath = { path: string[]; territorialImpactScore: number };

@Injectable()
export class RelationalSectorPropagationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalSectorPolicyService,
  ) {}

  async projectInterSectorPropagation(relationshipId: string): Promise<{
    cascadePaths: SectorPropagationPath[];
    maxDepthObserved: number;
  }> {
    const nodes = await this.prisma.relationalSectorNode.findMany({
      where: { relationshipId },
      select: { id: true },
    });
    if (nodes.length === 0) return { cascadePaths: [], maxDepthObserved: 0 };
    const idSet = new Set(nodes.map((n) => n.id));
    const adj = new Map<string, string[]>();
    const edges = await this.prisma.relationalSectorDependency.findMany({
      where: {
        OR: [
          { sourceSectorId: { in: [...idSet] } },
          { targetSectorId: { in: [...idSet] } },
        ],
      },
    });
    for (const e of edges) {
      if (!idSet.has(e.sourceSectorId) || !idSet.has(e.targetSectorId)) continue;
      const a = adj.get(e.sourceSectorId) ?? [];
      a.push(e.targetSectorId);
      adj.set(e.sourceSectorId, a);
      const b = adj.get(e.targetSectorId) ?? [];
      b.push(e.sourceSectorId);
      adj.set(e.targetSectorId, b);
    }
    const start = nodes[0]!.id;
    const maxD = this.policy.maxPropagationDepth();
    const cascadePaths: SectorPropagationPath[] = [];
    const queue: { id: string; path: string[] }[] = [{ id: start, path: [start] }];
    const visited = new Set<string>();
    while (queue.length) {
      const cur = queue.shift()!;
      if (visited.has(cur.id)) continue;
      visited.add(cur.id);
      if (cur.path.length - 1 >= maxD) continue;
      const nbrs = adj.get(cur.id) ?? [];
      for (const n of nbrs) {
        if (cur.path.includes(n)) continue;
        const np = [...cur.path, n];
        cascadePaths.push({
          path: np,
          territorialImpactScore: this.policy.clampInt(np.length * 22 + nbrs.length * 4),
        });
        if (np.length - 1 < maxD) queue.push({ id: n, path: np });
      }
    }
    const maxDepthObserved = cascadePaths.reduce((m, p) => Math.max(m, p.path.length - 1), 0);
    return { cascadePaths: cascadePaths.slice(0, 48), maxDepthObserved };
  }

  systemicExposureScore(paths: SectorPropagationPath[]): number {
    if (paths.length === 0) return 0;
    const m = paths.reduce((acc, p) => Math.max(acc, p.territorialImpactScore), 0);
    return this.policy.clampInt(m + paths.length * 3);
  }
}
