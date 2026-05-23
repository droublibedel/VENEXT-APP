import { Injectable } from "@nestjs/common";
import type { DelayCongestionRadarResponse } from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";
import { normalizeTerritoryLabel } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class DelayCongestionService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): DelayCongestionRadarResponse {
    const { organizationId, generatedAt, orders, orgGeo } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        recurringDelayScore: 0,
        congestionEscalation: 0,
        routeInstability: 0,
        territoryCollapseRisk: 0,
        abnormalLatencyIndex: 0,
        hotspots: [],
        moduleNote: "supply_logistics_enabled",
      };
    }

    const now = Date.now();
    const corridorDelays = new Map<string, number>();
    const territoryFails = new Map<string, number>();
    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      const a = normalizeTerritoryLabel(orgGeo.get(o.sellerOrganizationId) ?? "?").normalizedCode;
      const b = normalizeTerritoryLabel(orgGeo.get(o.buyerOrganizationId) ?? "?").normalizedCode;
      const ck = `${a}→${b}`;
      if (now - o.updatedAt.getTime() > 72 * 3600000 && o.status !== OrderStatus.COMPLETED) {
        corridorDelays.set(ck, (corridorDelays.get(ck) ?? 0) + 1);
      }
      if (o.deliveryStatus === DeliveryStatus.FAILED) {
        const t = normalizeTerritoryLabel(orgGeo.get(o.buyerOrganizationId) ?? "?").normalizedCode;
        territoryFails.set(t, (territoryFails.get(t) ?? 0) + 1);
      }
    }

    const recurringDelayScore = Math.min(1, [...corridorDelays.values()].reduce((s, n) => s + n, 0) / 18);
    const congestionEscalation = Math.min(1, orders.filter((o) => o.deliveryStatus === DeliveryStatus.PREPARING).length / 14);
    const routeInstability = Math.min(1, recurringDelayScore * 0.55 + congestionEscalation * 0.45);
    const territoryCollapseRisk = Math.min(1, [...territoryFails.values()].reduce((s, n) => s + n, 0) / 10);
    const abnormalLatencyIndex = Math.min(1, routeInstability * 0.5 + territoryCollapseRisk * 0.5);

    const hotspots = [...corridorDelays.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, n]) => ({
        key,
        label: key.replace("→", " → "),
        intensity: Number(Math.min(1, n / 6).toFixed(3)),
      }));

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      recurringDelayScore: Number(recurringDelayScore.toFixed(3)),
      congestionEscalation: Number(congestionEscalation.toFixed(3)),
      routeInstability: Number(routeInstability.toFixed(3)),
      territoryCollapseRisk: Number(territoryCollapseRisk.toFixed(3)),
      abnormalLatencyIndex: Number(abnormalLatencyIndex.toFixed(3)),
      hotspots,
      moduleNote: "Delay radar — normalized corridor keys · recurring latency clusters (Instruction 15A).",
    };
  }
}
