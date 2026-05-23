import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalSupplyFlowDependencyType } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";

export type SupplyFlowDependencyInputs = {
  relationshipId: string;
  openIncidentCount: number;
  coordinationOpenCount: number;
  blockingFulfillmentTaskCount: number;
  pressureScore: number;
  fragilityScore: number;
  geoFragilityScore: number;
  sectorMaxOperationalRisk: number;
  predictiveUnresolvedAvgScore: number;
  predictiveUnresolvedCount: number;
  strategicMemoryActiveCount: number;
  strategicMemoryAvgConfidence: number;
  operationalMetricStress: number;
  peerCorridorEdgeCount: number;
};

export type ComputedSupplyFlowDependencyEdge = {
  dependencyStrength: number;
  dependencyProbability: number;
  bottleneckTransferScore: number;
  sharedPressureScore: number;
  diagnostics: Prisma.InputJsonValue;
};

@Injectable()
export class RelationalSupplyFlowDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalSupplyFlowPolicyService,
  ) {}

  /**
   * Instruction 20.24A — deterministic dependency edge (no fixed strength/probability constants).
   */
  static computeDependencyEdge(input: SupplyFlowDependencyInputs): ComputedSupplyFlowDependencyEdge {
    const incidentWeight = Math.min(100, input.openIncidentCount * 11);
    const coordinationWeight = Math.min(
      100,
      input.coordinationOpenCount * 4 + input.blockingFulfillmentTaskCount * 14,
    );
    const pressureWeight = Math.min(100, input.pressureScore);
    const fragilityWeight = Math.min(
      100,
      Math.round(input.fragilityScore * 0.72 + input.geoFragilityScore * 0.28),
    );
    const sectorWeight = Math.min(100, Math.round(input.sectorMaxOperationalRisk * 0.62));
    const predictiveWeight =
      input.predictiveUnresolvedCount === 0
        ? 0
        : Math.min(100, Math.round(input.predictiveUnresolvedAvgScore * 0.55));
    const memoryWeight =
      input.strategicMemoryActiveCount === 0
        ? 0
        : Math.min(
            100,
            Math.round(input.strategicMemoryActiveCount * 6 + input.strategicMemoryAvgConfidence * 0.18),
          );
    const metricsWeight = Math.min(100, Math.round(input.operationalMetricStress));
    const peerWeight = Math.min(100, input.peerCorridorEdgeCount * 2);

    const dependencyStrength = Math.round(
      incidentWeight * 0.2 +
        coordinationWeight * 0.14 +
        pressureWeight * 0.14 +
        fragilityWeight * 0.12 +
        sectorWeight * 0.1 +
        predictiveWeight * 0.08 +
        memoryWeight * 0.06 +
        metricsWeight * 0.08 +
        peerWeight * 0.08,
    );
    const strength = Math.max(0, Math.min(100, dependencyStrength));

    const dependencyProbability = Math.max(
      0.05,
      Math.min(0.95, Math.round((strength / 100) * 0.88 * 1000) / 1000 + (input.openIncidentCount > 0 ? 0.04 : 0.02)),
    );

    const bottleneckTransferScore = Math.min(
      100,
      Math.round(strength * 0.82 + coordinationWeight * 0.18),
    );
    const sharedPressureScore = Math.min(100, Math.round((pressureWeight + fragilityWeight) / 2));

    const diagnostics: Prisma.InputJsonValue = {
      computedFrom: [
        "open_incidents",
        "coordination_tasks",
        "economic_pressure",
        "geo_fragility",
        "sector_operational_risk",
        "predictive_risk_signals",
        "strategic_memories",
        "operational_metrics",
        "peer_corridor_edges",
      ],
      incidentWeight,
      coordinationWeight,
      coordinationSaturationWeight: coordinationWeight,
      pressureWeight,
      fragilityWeight,
      sectorWeight,
      predictiveWeight,
      memoryWeight,
      metricsWeight,
      peerWeight,
      relationshipId: input.relationshipId,
    };

    return {
      dependencyStrength: strength,
      dependencyProbability,
      bottleneckTransferScore,
      sharedPressureScore,
      diagnostics,
    };
  }

  computeFlowDependencyStrength(a: { disruptionRiskScore: number }, b: { disruptionRiskScore: number }): number {
    return this.policy.clampInt((a.disruptionRiskScore + b.disruptionRiskScore) / 2);
  }

  detectAsymmetricFlowDependency(primary: { dependencyScore: number }, secondary: { dependencyScore: number }): number {
    return this.policy.clampInt(Math.abs(primary.dependencyScore - secondary.dependencyScore));
  }

  computeFlowSystemicWeight(nodes: { disruptionRiskScore: number; dependencyScore: number }[]): number {
    if (nodes.length === 0) return 0;
    const m = nodes.reduce((acc, n) => Math.max(acc, n.disruptionRiskScore + n.dependencyScore * 0.35), 0);
    return this.policy.clampInt(m);
  }

  async persistCorridorDependencyEdge(
    relationshipId: string,
    primaryFlowId: string,
    secondaryFlowId: string,
    computed: ComputedSupplyFlowDependencyEdge,
  ): Promise<void> {
    await this.prisma.relationalSupplyFlowEdge.deleteMany({
      where: {
        OR: [
          { sourceFlowId: primaryFlowId, targetFlowId: secondaryFlowId },
          { sourceFlowId: secondaryFlowId, targetFlowId: primaryFlowId },
        ],
      },
    });
    await this.prisma.relationalSupplyFlowEdge.create({
      data: {
        sourceFlowId: primaryFlowId,
        targetFlowId: secondaryFlowId,
        dependencyType: RelationalSupplyFlowDependencyType.SEQUENTIAL_DOWNSTREAM,
        dependencyStrength: computed.dependencyStrength,
        propagationProbability: computed.dependencyProbability,
        bottleneckTransferScore: computed.bottleneckTransferScore,
        sharedPressureScore: computed.sharedPressureScore,
        diagnostics: computed.diagnostics,
        metadata: { relationshipId, kind: "corridor_dual_flow" } as Prisma.InputJsonValue,
      },
    });
  }
}
