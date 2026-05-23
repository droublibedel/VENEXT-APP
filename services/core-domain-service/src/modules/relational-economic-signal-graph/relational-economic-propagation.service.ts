import { Injectable } from "@nestjs/common";
import type { RelationalEconomicPropagationRisk } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { ECONOMIC_GRAPH_ENGINE_THRESHOLDS, RelationalEconomicSignalPolicyService } from "./relational-economic-signal-policy.service";

export type PropagationAnalysis = {
  relationshipId: string;
  propagationRisk: RelationalEconomicPropagationRisk;
  cascadeDepth: number;
  exposureScore: number;
  affectedNodeIds: string[];
  collapseProbability: number;
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class RelationalEconomicPropagationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSignalPolicyService,
  ) {}

  async detectPropagationRisk(relationshipId: string): Promise<PropagationAnalysis> {
    const node = await this.prisma.relationalEconomicSignalNode.findFirst({
      where: { relationshipId, nodeType: "CORRIDOR" },
    });
    if (!node) {
      return {
        relationshipId,
        propagationRisk: "LOW",
        cascadeDepth: 0,
        exposureScore: 0,
        affectedNodeIds: [],
        collapseProbability: 0,
        diagnostics: { reason: "no_node" },
      };
    }

    const edges = await this.prisma.relationalEconomicSignalEdge.findMany({
      where: { OR: [{ sourceNodeId: node.id }, { targetNodeId: node.id }] },
      include: { sourceNode: true, targetNode: true },
    });

    const visited = new Set<string>([node.id]);
    const queue: { nodeId: string; depth: number; exposure: number }[] = [
      { nodeId: node.id, depth: 0, exposure: node.systemicExposureScore },
    ];
    let maxDepth = 0;
    let accumulatedExposure = node.systemicExposureScore;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= ECONOMIC_GRAPH_ENGINE_THRESHOLDS.maxCascadeDepth) continue;
      const adjacent = edges.filter(
        (e) => e.sourceNodeId === current.nodeId || e.targetNodeId === current.nodeId,
      );
      for (const edge of adjacent) {
        const nextId = edge.sourceNodeId === current.nodeId ? edge.targetNodeId : edge.sourceNodeId;
        if (visited.has(nextId)) continue;
        visited.add(nextId);
        const nextExposure = this.policy.boundedCascadeExposure(
          current.depth + 1,
          accumulatedExposure + edge.sharedOperationalStress,
        );
        accumulatedExposure = nextExposure;
        maxDepth = Math.max(maxDepth, current.depth + 1);
        queue.push({ nodeId: nextId, depth: current.depth + 1, exposure: nextExposure });
      }
    }

    const propagationRisk = this.policy.propagationRiskFromScore(accumulatedExposure, edges.length);
    const collapseProbability = Math.min(1, accumulatedExposure / 100);

    return {
      relationshipId,
      propagationRisk,
      cascadeDepth: maxDepth,
      exposureScore: accumulatedExposure,
      affectedNodeIds: [...visited],
      collapseProbability,
      diagnostics: {
        edgeCount: edges.length,
        highStressEdges: edges.filter((e) => e.correlationStrength === "CRITICAL" || e.correlationStrength === "STRONG")
          .length,
      },
    };
  }

  async projectCascadeCollapse(
    relationshipId: string,
    maxDepth = ECONOMIC_GRAPH_ENGINE_THRESHOLDS.maxCascadeDepth,
  ): Promise<PropagationAnalysis> {
    const base = await this.detectPropagationRisk(relationshipId);
    return {
      ...base,
      cascadeDepth: Math.min(base.cascadeDepth, maxDepth),
      exposureScore: this.policy.boundedCascadeExposure(base.cascadeDepth, base.exposureScore),
    };
  }
}
