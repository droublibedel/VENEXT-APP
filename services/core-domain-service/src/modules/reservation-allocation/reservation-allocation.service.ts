import { Injectable } from "@nestjs/common";
import type { ReservationAllocationResponse, ReservationAllocationRow } from "@venext/shared-contracts";
import { OrderStatus, ReservationIntentStatus } from "@prisma/client";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";

@Injectable()
export class ReservationAllocationService {
  build(snapshot: OrderAdvRawSnapshot, enabled: boolean): ReservationAllocationResponse {
    const { organizationId, generatedAt, orders, economicStates, reservationIntents } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        rows: [],
        moduleNote: "reservation_allocation_enabled",
      };
    }

    const intentUnitsByProduct = new Map<string, number>();
    for (const ri of reservationIntents) {
      if (ri.status !== ReservationIntentStatus.REQUESTED && ri.status !== ReservationIntentStatus.RESERVED) continue;
      const q = Number(ri.reservedQuantity ?? ri.requestedQuantity);
      intentUnitsByProduct.set(ri.productId, (intentUnitsByProduct.get(ri.productId) ?? 0) + q);
    }

    const draftUnits = new Map<string, { name: string; units: number }>();
    for (const o of orders) {
      if (o.status !== OrderStatus.DRAFT) continue;
      for (const it of o.items) {
        const pid = it.product.id;
        const cur = draftUnits.get(pid) ?? { name: it.product.name, units: 0 };
        cur.units += Number(it.quantity);
        draftUnits.set(pid, cur);
      }
    }

    const resolveProductName = (productId: string) => {
      const d = draftUnits.get(productId);
      if (d) return d.name;
      for (const o of orders) {
        const hit = o.items.find((it) => it.product.id === productId);
        if (hit) return hit.product.name;
      }
      return `Product ${productId.slice(0, 8)}…`;
    };

    const productIds = new Set<string>([...draftUnits.keys(), ...intentUnitsByProduct.keys()]);

    const rows: ReservationAllocationRow[] = [];
    for (const productId of productIds) {
      const draft = draftUnits.get(productId);
      const units = draft?.units ?? 0;
      const intentUnits = intentUnitsByProduct.get(productId) ?? 0;
      const econ = economicStates.find((e) => e.productId === productId);
      const stockT = econ?.stockTensionLevel ?? 0.2;
      const allocationConflictScore = Math.min(1, units / 40 + intentUnits / 55 + stockT * 0.45);
      const expirationPressure = Math.min(1, units / 55 + intentUnits / 70 + (econ?.demandVelocity ?? 0) * 0.28);
      const retailerReservationPressure = Math.min(1, stockT * 0.55 + (units + intentUnits) / 42);
      rows.push({
        productId,
        productName: resolveProductName(productId),
        reservedDraftUnits: Math.round(units * 1000) / 1000,
        intentReservedUnits: intentUnits > 0 ? Math.round(intentUnits * 1000) / 1000 : undefined,
        allocationConflictScore: Number(allocationConflictScore.toFixed(3)),
        expirationPressure: Number(expirationPressure.toFixed(3)),
        retailerReservationPressure: Number(retailerReservationPressure.toFixed(3)),
      });
    }

    rows.sort((a, b) => b.allocationConflictScore - a.allocationConflictScore);

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      rows: rows.slice(0, 32),
      moduleNote: "ReservationIntent + DRAFT order lines + ProductEconomicState tension.",
    };
  }
}
