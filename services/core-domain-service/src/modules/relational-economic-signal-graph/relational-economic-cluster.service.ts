import { Injectable } from "@nestjs/common";
import type { RelationalEconomicSignalSeverity } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { ECONOMIC_GRAPH_ENGINE_THRESHOLDS } from "./relational-economic-signal-policy.service";

export type OperationalCluster = {
  clusterCode: string;
  clusterScore: number;
  clusterRisk: RelationalEconomicSignalSeverity;
  dominantSignals: string[];
  corridorCount: number;
  sharedOperationalPressure: number;
  nodeIds: string[];
};

@Injectable()
export class RelationalEconomicClusterService {
  constructor(private readonly prisma: PrismaService) {}

  async buildOperationalClusters(anchorRelationshipId?: string): Promise<OperationalCluster[]> {
    const nodes = await this.prisma.relationalEconomicSignalNode.findMany({
      where: anchorRelationshipId
        ? {
            OR: [
              { relationshipId: anchorRelationshipId },
              {
                outgoingEdges: {
                  some: { targetNode: { relationshipId: { not: anchorRelationshipId } } },
                },
              },
            ],
          }
        : { systemicExposureScore: { gte: 40 } },
      take: 50,
    });
    if (nodes.length < ECONOMIC_GRAPH_ENGINE_THRESHOLDS.clusterMinEdgeStrength) return [];

    const visited = new Set<string>();
    const clusters: OperationalCluster[] = [];

    for (const seed of nodes) {
      if (visited.has(seed.id)) continue;
      const component = await this.bfsComponent(seed.id);
      if (component.length < 2) continue;
      component.forEach((id) => visited.add(id));

      const componentNodes = nodes.filter((n) => component.includes(n.id));
      const pressure = Math.round(
        componentNodes.reduce((s, n) => s + n.operationalFragilityScore, 0) / componentNodes.length,
      );
      const clusterScore = Math.min(
        100,
        Math.round(componentNodes.reduce((s, n) => s + n.systemicExposureScore, 0) / componentNodes.length),
      );
      const maxSeverity = componentNodes.some((n) => n.severity === "CRITICAL")
        ? "CRITICAL"
        : componentNodes.some((n) => n.severity === "HIGH")
          ? "HIGH"
          : "MEDIUM";

      clusters.push({
        clusterCode: `CLUSTER:${anchorRelationshipId?.slice(0, 8) ?? "GLOBAL"}:${clusters.length + 1}`,
        clusterScore,
        clusterRisk: maxSeverity as RelationalEconomicSignalSeverity,
        dominantSignals: [
          ...new Set(
            componentNodes.flatMap((n) => [
              n.propagationRisk,
              n.severity,
            ]),
          ),
        ].slice(0, 5),
        corridorCount: componentNodes.filter((n) => n.relationshipId).length,
        sharedOperationalPressure: pressure,
        nodeIds: component,
      });
    }
    return clusters;
  }

  private async bfsComponent(startNodeId: string): Promise<string[]> {
    const edges = await this.prisma.relationalEconomicSignalEdge.findMany({
      where: {
        OR: [{ sourceNodeId: startNodeId }, { targetNodeId: startNodeId }],
        correlationStrength: { in: ["MODERATE", "STRONG", "CRITICAL"] },
      },
    });
    const adj = new Map<string, string[]>();
    for (const e of edges) {
      const a = adj.get(e.sourceNodeId) ?? [];
      a.push(e.targetNodeId);
      adj.set(e.sourceNodeId, a);
      const b = adj.get(e.targetNodeId) ?? [];
      b.push(e.sourceNodeId);
      adj.set(e.targetNodeId, b);
    }
    const visited = new Set<string>([startNodeId]);
    const queue = [startNodeId];
    while (queue.length) {
      const id = queue.shift()!;
      for (const next of adj.get(id) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }
    return [...visited];
  }
}
