import { Injectable } from "@nestjs/common";
import type { DeliveryRouteIntelligenceResponse, DeliveryRouteRow } from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";
import { normalizeTerritoryLabel } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class DeliveryRouteIntelligenceService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): DeliveryRouteIntelligenceResponse {
    const { organizationId, generatedAt, orders, orgGeo } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        overloadedRoutes: [],
        congestionClusters: 0,
        rows: [],
        telemetryNote: "Route corridors are org-territory pairs — GPS telemetry not configured.",
        moduleNote: "supply_logistics_enabled",
      };
    }

    const byCorridor = new Map<
      string,
      { n: number; failed: number; delayed: number; preparing: number; out: number }
    >();
    const now = Date.now();
    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      const a = normalizeTerritoryLabel(orgGeo.get(o.sellerOrganizationId) ?? "?").normalizedCode;
      const b = normalizeTerritoryLabel(orgGeo.get(o.buyerOrganizationId) ?? "?").normalizedCode;
      const ck = `${a}→${b}`;
      const cur = byCorridor.get(ck) ?? { n: 0, failed: 0, delayed: 0, preparing: 0, out: 0 };
      cur.n += 1;
      if (o.deliveryStatus === DeliveryStatus.FAILED) cur.failed += 1;
      if (now - o.updatedAt.getTime() > 72 * 3600000 && o.status !== OrderStatus.COMPLETED) cur.delayed += 1;
      if (o.deliveryStatus === DeliveryStatus.PREPARING) cur.preparing += 1;
      if (o.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY) cur.out += 1;
      byCorridor.set(ck, cur);
    }

    const rows: DeliveryRouteRow[] = [];
    for (const [corridorKey, v] of byCorridor) {
      const loadFactor = Math.min(1, v.n / 20 + v.preparing / 8);
      const instability = Math.min(1, v.failed / 5 + v.delayed / 7 + v.out / 12);
      const delayCorridor = v.delayed > 2 || v.failed > 1;
      const bottleneck = v.preparing > 4 && v.out < 2;
      const recurringFailureHint = Math.min(1, v.failed / Math.max(1, v.n) * 2.2);
      rows.push({
        corridorKey,
        label: corridorKey.replace("→", " → "),
        loadFactor: Number(loadFactor.toFixed(3)),
        instability: Number(instability.toFixed(3)),
        delayCorridor,
        bottleneck,
        activeShipments: v.n,
        recurringFailureHint: Number(recurringFailureHint.toFixed(3)),
      });
    }
    rows.sort((a, b) => b.instability - a.instability);

    const overloadedRoutes = rows.filter((r) => r.loadFactor > 0.55 || r.instability > 0.5).map((r) => r.corridorKey);
    const congestionClusters = rows.filter((r) => r.bottleneck || r.delayCorridor).length;

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      overloadedRoutes,
      congestionClusters,
      rows: rows.slice(0, 24),
      telemetryNote: "Future-ready for GPS / edge route sync — currently heuristic on order-corridor aggregates.",
      moduleNote: "Route intelligence — normalized corridor keys · load & failure recurrence (Instruction 15A).",
    };
  }
}
