import { Injectable } from "@nestjs/common";
import type { LoadingSupervisionResponse, LoadingSupervisionRow } from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";

@Injectable()
export class LoadingSupervisionService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): LoadingSupervisionResponse {
    const { organizationId, generatedAt, orders } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        loadingDelayCount: 0,
        unloadingInstabilityCount: 0,
        queueCongestionScore: 0,
        rows: [],
        moduleNote: "supply_logistics_enabled",
      };
    }

    const now = Date.now();
    const rows: LoadingSupervisionRow[] = [];
    let loadingDelayCount = 0;
    let unloadingInstabilityCount = 0;

    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      const ageH = (now - o.updatedAt.getTime()) / 3600000;
      if (o.status === OrderStatus.ACCEPTED && o.deliveryStatus === DeliveryStatus.NOT_STARTED && ageH > 18) {
        loadingDelayCount += 1;
        const waitPressure = Math.min(1, ageH / 72 + 0.2);
        rows.push({
          orderId: o.id,
          kind: "loading",
          waitPressure: Number(waitPressure.toFixed(3)),
          handlingAnomalyScore: Number(Math.min(1, ageH / 96).toFixed(3)),
          label: `Dispatch queue — order ${o.id.slice(0, 8)}`,
        });
      }
      if (o.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY && ageH > 36) {
        unloadingInstabilityCount += 1;
        rows.push({
          orderId: o.id,
          kind: "unloading",
          waitPressure: Number(Math.min(1, ageH / 80).toFixed(3)),
          handlingAnomalyScore: Number(Math.min(1, (ageH - 36) / 48).toFixed(3)),
          label: `Last-mile dwell — order ${o.id.slice(0, 8)}`,
        });
      }
      if (o.status === OrderStatus.SUBMITTED && ageH > 24) {
        rows.push({
          orderId: o.id,
          kind: "dispatch_queue",
          waitPressure: Number(Math.min(1, ageH / 60).toFixed(3)),
          handlingAnomalyScore: 0.35,
          label: `Submission backlog — order ${o.id.slice(0, 8)}`,
        });
      }
    }

    const queueCongestionScore = Math.min(1, loadingDelayCount / 10 + unloadingInstabilityCount / 8 + rows.length / 40);

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      loadingDelayCount,
      unloadingInstabilityCount,
      queueCongestionScore: Number(queueCongestionScore.toFixed(3)),
      rows: rows.slice(0, 28),
      moduleNote: "Loading/unloading supervision — dwell on accepted-not-dispatched and out-for-delivery aging.",
    };
  }
}
