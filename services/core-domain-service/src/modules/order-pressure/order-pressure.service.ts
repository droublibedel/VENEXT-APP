import { Injectable } from "@nestjs/common";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { OrderPressureCell, OrderPressureResponse } from "@venext/shared-contracts";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";

@Injectable()
export class OrderPressureService {
  build(snapshot: OrderAdvRawSnapshot, enabled: boolean): OrderPressureResponse {
    const { organizationId, generatedAt, orders, negotiations, groupSessions, economicStates } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        surgeTerritories: [],
        retailerPressure: 0,
        distributorOverload: 0,
        productShortageSignals: 0,
        reservationSpike: 0,
        fulfillmentAnomalyScore: 0,
        cells: [],
      };
    }

    const byTerritory = new Map<string, { orders: number; negs: number; gb: number }>();
    const bump = (key: string, field: "orders" | "negs" | "gb") => {
      const cur = byTerritory.get(key) ?? { orders: 0, negs: 0, gb: 0 };
      cur[field] += 1;
      byTerritory.set(key, cur);
    };

    for (const o of orders) {
      const other = o.sellerOrganizationId === organizationId ? o.buyerOrganizationId : o.sellerOrganizationId;
      const k = snapshot.orgGeo.get(other) ?? "unknown";
      if (k !== "unknown") bump(k, "orders");
    }
    for (const n of negotiations) {
      const other = n.sellerOrganizationId === organizationId ? n.buyerOrganizationId : n.sellerOrganizationId;
      const k = snapshot.orgGeo.get(other) ?? "unknown";
      if (k !== "unknown") bump(k, "negs");
    }
    for (const g of groupSessions) {
      const k = snapshot.orgGeo.get(g.initiatorOrganizationId) ?? "unknown";
      if (k !== "unknown") bump(k, "gb");
    }

    const cells: OrderPressureCell[] = [];
    let maxP = 0;
    for (const [territoryKey, v] of byTerritory) {
      const pressure = Math.min(1, v.orders / 18 + v.negs / 12 + v.gb / 6);
      maxP = Math.max(maxP, pressure);
      cells.push({
        territoryKey,
        label: territoryKey.replace("/", " · "),
        pressure: Number(pressure.toFixed(3)),
        drivers: [
          v.orders ? `orders:${v.orders}` : "",
          v.negs ? `negotiations:${v.negs}` : "",
          v.gb ? `group_buy:${v.gb}` : "",
        ].filter(Boolean),
      });
    }
    cells.sort((a, b) => b.pressure - a.pressure);

    const surgeTerritories = cells.filter((c) => c.pressure > 0.45).map((c) => c.territoryKey);

    const retailerPressure = Math.min(
      1,
      negotiations.length / 80 + orders.filter((o) => o.status === OrderStatus.SUBMITTED).length / 30,
    );
    const distributorOverload = Math.min(1, delayedOrderRatio(orders) + economicStates.filter((e) => e.stockTensionLevel > 0.55).length / 12);
    const productShortageSignals = economicStates.filter((e) => e.stockTensionLevel > 0.45).length;
    const reservationSpike = Math.min(1, orders.filter((o) => o.status === "DRAFT").length / 25);
    const fulfillmentAnomalyScore = Math.min(
      1,
      orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED).length / 8 +
        orders.filter((o) => o.deliveryStatus === DeliveryStatus.NOT_STARTED && o.status === OrderStatus.ACCEPTED).length / 20,
    );

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      surgeTerritories: surgeTerritories.slice(0, 8),
      retailerPressure: Number(retailerPressure.toFixed(3)),
      distributorOverload: Number(distributorOverload.toFixed(3)),
      productShortageSignals,
      reservationSpike: Number(reservationSpike.toFixed(3)),
      fulfillmentAnomalyScore: Number(fulfillmentAnomalyScore.toFixed(3)),
      cells: cells.slice(0, 16),
    };
  }
}

function delayedOrderRatio(orders: OrderAdvRawSnapshot["orders"]) {
  const now = Date.now();
  const late = orders.filter((o) => now - o.updatedAt.getTime() > 96 * 3600000 && o.status !== "COMPLETED" && o.status !== "CANCELLED").length;
  return Math.min(1, late / Math.max(10, orders.length));
}
