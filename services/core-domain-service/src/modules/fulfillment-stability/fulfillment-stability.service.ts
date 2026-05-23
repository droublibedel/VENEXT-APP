import { Injectable } from "@nestjs/common";
import type { FulfillmentStabilityMatrixResponse } from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";

@Injectable()
export class FulfillmentStabilityService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): FulfillmentStabilityMatrixResponse {
    const { organizationId, generatedAt, orders, economicStates } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        stabilityScore: 0,
        executionVariance: 0,
        downstreamCoherence: 0,
        bands: [],
        moduleNote: "supply_logistics_enabled",
      };
    }

    const completed = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const failed = orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED).length;
    const inMotion = orders.filter((o) => o.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY).length;
    const variance = Math.min(1, failed / Math.max(4, orders.length) + Math.abs(inMotion - completed / 3) / 20);
    const stabilityScore = Math.min(1, 0.62 + completed / Math.max(12, orders.length) * 0.28 - failed * 0.04 - variance * 0.2);
    const demandVar =
      economicStates.length > 0
        ? economicStates.reduce((s, e) => s + Math.abs(e.demandVelocity - 0.5), 0) / economicStates.length
        : 0.2;
    const downstreamCoherence = Math.min(1, stabilityScore * 0.7 + (1 - demandVar) * 0.3);

    const bands = [
      {
        id: "band-exec",
        label: "Execution coherence",
        score: Number(stabilityScore.toFixed(3)),
        vector: stabilityScore > 0.55 ? ("stable" as const) : stabilityScore > 0.35 ? ("drift" as const) : ("rupture" as const),
      },
      {
        id: "band-var",
        label: "Variance envelope",
        score: Number((1 - variance).toFixed(3)),
        vector: variance < 0.35 ? ("stable" as const) : variance < 0.55 ? ("drift" as const) : ("rupture" as const),
      },
      {
        id: "band-down",
        label: "Downstream alignment",
        score: Number(downstreamCoherence.toFixed(3)),
        vector: downstreamCoherence > 0.5 ? ("stable" as const) : downstreamCoherence > 0.32 ? ("drift" as const) : ("rupture" as const),
      },
    ];

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      stabilityScore: Number(stabilityScore.toFixed(3)),
      executionVariance: Number(variance.toFixed(3)),
      downstreamCoherence: Number(downstreamCoherence.toFixed(3)),
      bands,
      moduleNote: "Fulfillment stability — completion vs failure vs in-motion variance.",
    };
  }
}
