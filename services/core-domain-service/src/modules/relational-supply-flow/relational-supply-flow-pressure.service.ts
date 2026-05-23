import { Injectable } from "@nestjs/common";
import type { RelationalSupplyFlowNode } from "@prisma/client";

import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";

export type SupplyFlowOverviewResult = {
  criticalFlows: { flowId: string; flowCode: string; flowName: string; score: number }[];
  bottleneckFlows: { flowId: string; flowCode: string; flowName: string; score: number }[];
  disruptionRisks: { flowId: string; flowCode: string; flowName: string; score: number }[];
  continuityWarnings: { flowId: string; flowCode: string; flowName: string; score: number }[];
  dependencyWarnings: { flowId: string; flowCode: string; flowName: string; score: number }[];
  propagationChains: string[][];
  pressureByCategory: Record<string, number>;
  pressureByTerritory: Record<string, number>;
  flowPressure: number;
  fulfillmentPressure: number;
  incidentPressure: number;
  dependencyPressure: number;
  bottleneckPressure: number;
  propagationPressure: number;
  continuityPressure: number;
};

@Injectable()
export class RelationalSupplyFlowPressureService {
  constructor(private readonly policy: RelationalSupplyFlowPolicyService) {}

  computeSupplyFlowOverview(
    nodes: RelationalSupplyFlowNode[],
    edges: { sourceFlowId: string; targetFlowId: string }[],
    incidentCount: number,
    fulfillmentCount: number,
    propagation: { cascadePaths: string[][]; maxDepthObserved: number },
  ): SupplyFlowOverviewResult {
    void edges;
    const active = nodes.filter((n) => n.active);
    const flowPressure = this.policy.clampInt(
      active.length === 0 ? 0 : active.reduce((s, n) => s + n.disruptionRiskScore, 0) / active.length,
    );
    const fulfillmentPressure = this.policy.clampInt(Math.min(100, fulfillmentCount * 5));
    const incidentPressure = this.policy.clampInt(Math.min(100, incidentCount * 9));
    const dependencyPressure = this.policy.clampInt(
      active.length === 0 ? 0 : active.reduce((s, n) => s + n.dependencyScore, 0) / active.length,
    );
    const bottleneckPressure = this.policy.clampInt(
      active.length === 0 ? 0 : active.reduce((s, n) => s + n.bottleneckScore, 0) / active.length,
    );
    const propagationPressure = this.policy.clampInt(propagation.maxDepthObserved * 14);
    const continuityPressure = this.policy.clampInt(
      active.length === 0
        ? 0
        : active.reduce((s, n) => s + (100 - n.supplyContinuityScore), 0) / Math.max(1, active.length),
    );

    const pressureByCategory: Record<string, number> = {};
    const pressureByTerritory: Record<string, number> = {};
    for (const n of active) {
      const c = n.productCategory || "UNKNOWN";
      pressureByCategory[c] = this.policy.clampInt((pressureByCategory[c] ?? 0) * 0.55 + n.disruptionRiskScore * 0.45);
      const t = `${n.territoryCountry}|${n.territoryCity}`;
      pressureByTerritory[t] = this.policy.clampInt((pressureByTerritory[t] ?? 0) * 0.55 + n.disruptionRiskScore * 0.45);
    }

    return {
      criticalFlows: active
        .filter((n) => n.disruptionRiskScore >= 62)
        .map((n) => ({ flowId: n.id, flowCode: n.flowCode, flowName: n.flowName, score: n.disruptionRiskScore }))
        .slice(0, 12),
      bottleneckFlows: active
        .filter((n) => n.bottleneckScore >= 48)
        .map((n) => ({ flowId: n.id, flowCode: n.flowCode, flowName: n.flowName, score: n.bottleneckScore }))
        .slice(0, 12),
      disruptionRisks: active
        .filter((n) => n.disruptionRiskScore >= 55)
        .map((n) => ({ flowId: n.id, flowCode: n.flowCode, flowName: n.flowName, score: n.disruptionRiskScore }))
        .slice(0, 12),
      continuityWarnings: active
        .filter((n) => n.supplyContinuityScore <= 52)
        .map((n) => ({
          flowId: n.id,
          flowCode: n.flowCode,
          flowName: n.flowName,
          score: 100 - n.supplyContinuityScore,
        }))
        .slice(0, 12),
      dependencyWarnings: active
        .filter((n) => n.dependencyScore >= 58)
        .map((n) => ({ flowId: n.id, flowCode: n.flowCode, flowName: n.flowName, score: n.dependencyScore }))
        .slice(0, 12),
      propagationChains: propagation.cascadePaths.slice(0, 24),
      pressureByCategory,
      pressureByTerritory,
      flowPressure,
      fulfillmentPressure,
      incidentPressure,
      dependencyPressure,
      bottleneckPressure,
      propagationPressure,
      continuityPressure,
    };
  }
}
