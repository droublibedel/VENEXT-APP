import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalSupplyFlowType, type RelationalSupplyFlowNode } from "@prisma/client";

import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";

export type BottleneckDiagnostics = {
  bottleneckReason: string;
  bottleneckDiagnostics: Record<string, number | string>;
};

@Injectable()
export class RelationalSupplyFlowBottleneckService {
  constructor(private readonly policy: RelationalSupplyFlowPolicyService) {}

  detectBottleneckFlows(
    nodes: RelationalSupplyFlowNode[],
    incidentCount: number,
    fulfillmentCount: number,
  ): Map<string, BottleneckDiagnostics & { bottleneckScore: number }> {
    const out = new Map<string, BottleneckDiagnostics & { bottleneckScore: number }>();
    for (const n of nodes) {
      let score = 18;
      const diag: Record<string, number | string> = { flowCode: n.flowCode };
      let reason = "Lecture stable";
      if (fulfillmentCount <= 1 && n.flowType === RelationalSupplyFlowType.FULFILLMENT_COUPLING) {
        score += 22;
        reason = "Couplage fulfillment peu diversifié (observation corridor)";
        diag.fulfillmentCoupling = fulfillmentCount;
      }
      if (incidentCount >= 2) {
        score += incidentCount * 8;
        reason = "Incidents répétés sur le corridor (fragilité d’écoulement)";
        diag.incidentCount = incidentCount;
      }
      if (n.fulfillmentReliabilityScore < 48) {
        score += 20;
        reason = "Fiabilité fulfillment sous seuil d’observation";
        diag.fulfillmentReliabilityScore = n.fulfillmentReliabilityScore;
      }
      if (n.flowStabilityScore < 45) {
        score += 16;
        reason = "Stabilité de flux sous pression";
        diag.flowStabilityScore = n.flowStabilityScore;
      }
      score = this.policy.clampInt(score);
      if (score >= 40) {
        out.set(n.id, {
          bottleneckScore: score,
          bottleneckReason: reason,
          bottleneckDiagnostics: diag,
        });
      }
    }
    return out;
  }

  mergeIntoDiagnostics(
    existing: Prisma.JsonValue | null | undefined,
    patch: { bottleneckReason: string; bottleneckDiagnostics: Record<string, number | string>; bottleneckScore: number },
  ): Prisma.InputJsonValue {
    const base = (existing && typeof existing === "object" ? existing : {}) as Record<string, unknown>;
    return {
      ...base,
      bottleneck: patch,
    } as Prisma.InputJsonValue;
  }
}
