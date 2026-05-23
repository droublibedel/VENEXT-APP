import { Injectable } from "@nestjs/common";
import type { ShipmentHealthResponse, ShipmentHealthRow } from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus, ShipmentHealthStatus, ShipmentStatus } from "@prisma/client";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";
import { normalizeTerritoryLabel } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class ShipmentHealthService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): ShipmentHealthResponse {
    const { organizationId, generatedAt, orders, orgGeo, shipments } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        healthyCount: 0,
        delayedCount: 0,
        unstableCount: 0,
        blockedCount: 0,
        suspiciousCount: 0,
        rows: [],
        moduleNote: "shipment_health_enabled",
      };
    }

    const instabilityByCorridor = this.corridorInstabilityMap(orders, orgGeo);
    const orderById = new Map(orders.map((o) => [o.id, o]));

    if (shipments.length > 0) {
      return this.buildFromShipments({
        organizationId,
        generatedAt,
        shipments,
        orderById,
        instabilityByCorridor,
      });
    }

    return this.buildFromOrderProxy({
      organizationId,
      generatedAt,
      orders,
      orgGeo,
      instabilityByCorridor,
    });
  }

  private corridorInstabilityMap(
    orders: SupplyLogisticsRawSnapshot["orders"],
    orgGeo: Map<string, string>,
  ): Map<string, number> {
    const byCorridor = new Map<string, { n: number; failed: number; delayed: number; preparing: number; out: number }>();
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
    const out = new Map<string, number>();
    for (const [ck, v] of byCorridor) {
      out.set(ck, Math.min(1, v.failed / 5 + v.delayed / 7 + v.out / 12));
    }
    return out;
  }

  private buildFromShipments(input: {
    organizationId: string;
    generatedAt: string;
    shipments: SupplyLogisticsRawSnapshot["shipments"];
    orderById: Map<string, SupplyLogisticsRawSnapshot["orders"][0]>;
    instabilityByCorridor: Map<string, number>;
  }): ShipmentHealthResponse {
    const { organizationId, generatedAt, shipments, orderById, instabilityByCorridor } = input;
    const rows: ShipmentHealthRow[] = [];
    let healthyCount = 0;
    let delayedCount = 0;
    let unstableCount = 0;
    let blockedCount = 0;
    let suspiciousCount = 0;
    const now = Date.now();

    for (const s of shipments.slice(0, 64)) {
      const o = s.orderId ? orderById.get(s.orderId) : undefined;
      const ageH = (now - s.updatedAt.getTime()) / 3600000;
      const a = normalizeTerritoryLabel(s.originTerritory).normalizedCode;
      const b = normalizeTerritoryLabel(s.destinationTerritory).normalizedCode;
      const corridorKey = `${a}→${b}`;
      const routeInstabilityHint = instabilityByCorridor.get(corridorKey) ?? 0;
      const deliveryStatus = o ? String(o.deliveryStatus) : String(s.shipmentStatus);
      const delayedMovement = s.shipmentStatus === ShipmentStatus.DELAYED || ageH > 72;
      const partialFulfillment = Boolean(o && o.status === OrderStatus.PARTIALLY_ACCEPTED);
      const blocked = s.shipmentStatus === ShipmentStatus.BLOCKED || o?.deliveryStatus === DeliveryStatus.FAILED;
      const delayProbability = Math.min(
        1,
        ageH / 120 + (blocked ? 0.45 : 0) + (partialFulfillment ? 0.12 : 0) + routeInstabilityHint * 0.25,
      );
      const deliveryConfidence = Math.min(
        1,
        0.72 - delayProbability * 0.35 + (s.shipmentStatus === ShipmentStatus.DELIVERED ? 0.25 : 0),
      );
      const fulfillmentQuality = Math.min(
        1,
        (s.shipmentStatus === ShipmentStatus.DELIVERED
          ? 0.95
          : s.shipmentStatus === ShipmentStatus.IN_TRANSIT
            ? 0.7
            : 0.45) - (delayedMovement ? 0.2 : 0),
      );
      const territoryStability = Math.min(1, 0.55 + (blocked ? -0.35 : 0.1) - Math.min(0.3, ageH / 200));
      const healthScore = Number(
        (deliveryConfidence * 0.34 + fulfillmentQuality * 0.33 + territoryStability * 0.33).toFixed(3),
      );
      const suspiciousBehavior =
        s.healthStatus === ShipmentHealthStatus.SUSPICIOUS ||
        (Boolean(o) && o!.status === OrderStatus.SUBMITTED && ageH > 36) ||
        (partialFulfillment && o && o.deliveryStatus === DeliveryStatus.NOT_STARTED && ageH > 24) ||
        (delayProbability > 0.78 && !blocked);
      const healthDegraded = healthScore < 0.48 && delayProbability > 0.55 && !blocked;

      let executionHealth: ShipmentHealthRow["executionHealth"] = "healthy";
      if (blocked) executionHealth = "blocked";
      else if (suspiciousBehavior) executionHealth = "suspicious";
      else if (s.healthStatus === ShipmentHealthStatus.CRITICAL || s.healthStatus === ShipmentHealthStatus.UNSTABLE)
        executionHealth = "unstable";
      else if (healthScore < 0.58 || delayedMovement) executionHealth = "watch";

      if (executionHealth === "healthy") healthyCount += 1;
      if (delayedMovement) delayedCount += 1;
      if (executionHealth === "unstable") unstableCount += 1;
      if (blocked) blockedCount += 1;
      if (executionHealth === "suspicious") suspiciousCount += 1;

      rows.push({
        orderId: s.orderId ?? s.id,
        shipmentId: s.id,
        corridorKey,
        deliveryStatus,
        healthScore,
        delayProbability: Number(delayProbability.toFixed(3)),
        deliveryConfidence: Number(deliveryConfidence.toFixed(3)),
        fulfillmentQuality: Number(fulfillmentQuality.toFixed(3)),
        territoryStability: Number(territoryStability.toFixed(3)),
        routeInstabilityHint: Number(routeInstabilityHint.toFixed(3)),
        executionHealth,
        movementSource: "SHIPMENT_TABLE",
        partialFulfillment,
        suspiciousBehavior,
        healthDegraded,
        ageHours: Number(ageH.toFixed(2)),
      });
    }

    rows.sort((a, b) => a.healthScore - b.healthScore);

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      healthyCount,
      delayedCount,
      unstableCount,
      blockedCount,
      suspiciousCount,
      rows,
      moduleNote: "Shipment health — SHIPMENT_TABLE source with corridor instability hints (Instruction 15A).",
    };
  }

  private buildFromOrderProxy(input: {
    organizationId: string;
    generatedAt: string;
    orders: SupplyLogisticsRawSnapshot["orders"];
    orgGeo: Map<string, string>;
    instabilityByCorridor: Map<string, number>;
  }): ShipmentHealthResponse {
    const { organizationId, generatedAt, orders, orgGeo, instabilityByCorridor } = input;
    const now = Date.now();
    const rows: ShipmentHealthRow[] = [];
    let healthyCount = 0;
    let delayedCount = 0;
    let unstableCount = 0;
    let blockedCount = 0;
    let suspiciousCount = 0;

    const active = orders.filter((o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED);
    for (const o of active.slice(0, 48)) {
      const ageH = (now - o.updatedAt.getTime()) / 3600000;
      const a = normalizeTerritoryLabel(orgGeo.get(o.sellerOrganizationId) ?? "?").normalizedCode;
      const b = normalizeTerritoryLabel(orgGeo.get(o.buyerOrganizationId) ?? "?").normalizedCode;
      const corridorKey = `${a}→${b}`;
      const routeInstabilityHint = instabilityByCorridor.get(corridorKey) ?? 0;
      const blocked = o.deliveryStatus === DeliveryStatus.FAILED;
      const delayed = ageH > 48 && o.status !== OrderStatus.DRAFT;
      const delayedMovement = delayed;
      const partialFulfillment = o.status === OrderStatus.PARTIALLY_ACCEPTED;
      const delayProbability = Math.min(
        1,
        ageH / 120 + (blocked ? 0.45 : 0) + (partialFulfillment ? 0.12 : 0) + routeInstabilityHint * 0.25,
      );
      const deliveryConfidence = Math.min(1, 0.72 - delayProbability * 0.35 + (o.deliveryStatus === DeliveryStatus.DELIVERED ? 0.25 : 0));
      const fulfillmentQuality = Math.min(
        1,
        (o.deliveryStatus === DeliveryStatus.DELIVERED ? 0.95 : o.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY ? 0.7 : 0.45) -
          (delayed ? 0.2 : 0),
      );
      const territoryStability = Math.min(1, 0.55 + (blocked ? -0.35 : 0.1) - Math.min(0.3, ageH / 200));
      const healthScore = Number(
        (deliveryConfidence * 0.34 + fulfillmentQuality * 0.33 + territoryStability * 0.33).toFixed(3),
      );
      const suspiciousBehavior =
        (o.status === OrderStatus.SUBMITTED && ageH > 36) ||
        (partialFulfillment && o.deliveryStatus === DeliveryStatus.NOT_STARTED && ageH > 24) ||
        (delayProbability > 0.78 && !blocked);
      const healthDegraded = healthScore < 0.48 && delayProbability > 0.55 && !blocked;

      let executionHealth: ShipmentHealthRow["executionHealth"] = "healthy";
      if (blocked) executionHealth = "blocked";
      else if (suspiciousBehavior) executionHealth = "suspicious";
      else if (healthScore < 0.38 || (delayed && ageH > 96)) executionHealth = "unstable";
      else if (healthScore < 0.58 || delayed) executionHealth = "watch";

      if (executionHealth === "healthy") healthyCount += 1;
      if (delayed) delayedCount += 1;
      if (executionHealth === "unstable") unstableCount += 1;
      if (blocked) blockedCount += 1;
      if (executionHealth === "suspicious") suspiciousCount += 1;

      rows.push({
        orderId: o.id,
        corridorKey,
        deliveryStatus: String(o.deliveryStatus),
        healthScore,
        delayProbability: Number(delayProbability.toFixed(3)),
        deliveryConfidence: Number(deliveryConfidence.toFixed(3)),
        fulfillmentQuality: Number(fulfillmentQuality.toFixed(3)),
        territoryStability: Number(territoryStability.toFixed(3)),
        routeInstabilityHint: Number(routeInstabilityHint.toFixed(3)),
        executionHealth,
        movementSource: "ORDERS_AS_SHIPMENT_PROXY",
        partialFulfillment,
        suspiciousBehavior,
        healthDegraded,
        ageHours: Number(ageH.toFixed(2)),
      });
    }

    rows.sort((a, b) => a.healthScore - b.healthScore);

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      healthyCount,
      delayedCount,
      unstableCount,
      blockedCount,
      suspiciousCount,
      rows,
      moduleNote: "Shipment health — ORDERS_AS_SHIPMENT_PROXY until shipment rows materialize (Instruction 15A).",
    };
  }
}
