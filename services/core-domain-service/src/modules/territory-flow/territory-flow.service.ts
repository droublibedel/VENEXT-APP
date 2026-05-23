import { Injectable } from "@nestjs/common";
import type { TerritoryFlowCell, TerritoryFlowResponse } from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";
import { normalizeTerritoryLabel } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class TerritoryFlowService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): TerritoryFlowResponse {
    const { organizationId, generatedAt, orders, orgGeo, groupSessions, economicSignals } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        cells: [],
        overloadedTerritories: [],
        weakSupplyTerritories: [],
        moduleNote: "territory_flow_enabled",
      };
    }

    const territoryKey = (orgId: string) => {
      const raw = orgGeo.get(orgId) ?? "";
      const n = normalizeTerritoryLabel(raw);
      return n.normalizedCode !== "UNKNOWN" ? n.normalizedCode : raw || "unknown";
    };

    const byT = new Map<string, { orders: number; failed: number; gb: number; signal: number }>();
    const add = (key: string, patch: Partial<{ orders: number; failed: number; gb: number; signal: number }>) => {
      const cur = byT.get(key) ?? { orders: 0, failed: 0, gb: 0, signal: 0 };
      Object.assign(cur, patch);
      byT.set(key, cur);
    };

    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      const dest = territoryKey(o.buyerOrganizationId);
      add(dest, { orders: (byT.get(dest)?.orders ?? 0) + 1 });
      if (o.deliveryStatus === DeliveryStatus.FAILED) {
        const c = byT.get(dest) ?? { orders: 0, failed: 0, gb: 0, signal: 0 };
        c.failed += 1;
        byT.set(dest, c);
      }
    }
    for (const g of groupSessions) {
      const k = territoryKey(g.initiatorOrganizationId);
      const c = byT.get(k) ?? { orders: 0, failed: 0, gb: 0, signal: 0 };
      c.gb += 1;
      byT.set(k, c);
    }
    for (const s of economicSignals) {
      const z = s.zoneCode?.trim() ?? "";
      if (!z) continue;
      const norm = normalizeTerritoryLabel(z.replace(/-/g, "/")).normalizedCode;
      if (norm === "UNKNOWN") continue;
      const c = byT.get(norm) ?? { orders: 0, failed: 0, gb: 0, signal: 0 };
      c.signal += s.intensityScore;
      byT.set(norm, c);
    }

    const cells: TerritoryFlowCell[] = [];
    for (const [territoryKey, v] of byT) {
      if (territoryKey === "unknown") continue;
      const flowPressure = Math.min(1, v.orders / 18 + v.failed / 5 + v.gb / 8 + v.signal / 25);
      const collapseRisk = Math.min(1, v.failed / 4 + v.signal / 20);
      let burstHint: TerritoryFlowCell["burstHint"] = "steady";
      if (flowPressure > 0.62) burstHint = "overload";
      else if (v.gb > 2 && flowPressure > 0.35) burstHint = "surge";
      else if (flowPressure < 0.18 && v.orders > 0) burstHint = "weak_supply";
      cells.push({
        territoryKey,
        label: territoryKey.replace(/_/g, " · "),
        flowPressure: Number(flowPressure.toFixed(3)),
        collapseRisk: Number(collapseRisk.toFixed(3)),
        burstHint,
        drivers: [
          v.orders ? `orders:${v.orders}` : "",
          v.failed ? `failed_delivery:${v.failed}` : "",
          v.gb ? `group_buy_open:${v.gb}` : "",
          v.signal ? `ext_signal_mass:${v.signal.toFixed(1)}` : "",
        ].filter(Boolean),
      });
    }
    cells.sort((a, b) => b.flowPressure - a.flowPressure);

    const overloadedTerritories = cells.filter((c) => c.flowPressure > 0.55 || c.burstHint === "overload").map((c) => c.territoryKey);
    const weakSupplyTerritories = cells.filter((c) => c.burstHint === "weak_supply").map((c) => c.territoryKey);

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      cells: cells.slice(0, 28),
      overloadedTerritories,
      weakSupplyTerritories,
      moduleNote: "Territory flow — normalized keys · orders × failures × group-buy × economic zone signals (Instruction 15A).",
    };
  }
}
