import { DeliveryStatus, OrderStatus, ShipmentStatus } from "@prisma/client";
import type { HubPressureSource } from "@venext/shared-contracts";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";

export type HubPressureRowBuilt = {
  hubKey: string;
  hubCode: string;
  territory: string;
  label: string;
  source: HubPressureSource;
  queuePressure: number;
  confidence: number;
  saturation: number;
  dispatchBottleneck: number;
  queueInstability: number;
  inventoryPressure: number;
  openDispatchCount: number;
};

/**
 * Instruction 15A — explicit hub pressure sources (shipment table → order proxy → edge future).
 * No unexplained synthetic pressure rows.
 */
export class HubPressureProvider {
  static build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): HubPressureRowBuilt[] {
    if (!enabled) return [];
    const { organizationId, orders, orgGeo, economicStates, shipments } = snapshot;
    const territory = orgGeo.get(organizationId) ?? "hub";
    const hubKey = territory;
    const hubCode = `HUB:${organizationId.slice(0, 8)}`;

    const avgTension =
      economicStates.length > 0
        ? economicStates.reduce((s, e) => s + e.stockTensionLevel, 0) / economicStates.length
        : 0;

    const outboundShipments = shipments;
    if (outboundShipments.length > 0) {
      const loading = outboundShipments.filter((s) => s.shipmentStatus === ShipmentStatus.LOADING).length;
      const delayed = outboundShipments.filter((s) => s.shipmentStatus === ShipmentStatus.DELAYED).length;
      const inMotion = outboundShipments.filter((s) => s.shipmentStatus === ShipmentStatus.IN_TRANSIT).length;
      const blocked = outboundShipments.filter((s) => s.shipmentStatus === ShipmentStatus.BLOCKED).length;
      const openDispatchCount = loading + delayed + inMotion + blocked;
      const queuePressure = Math.min(1, loading / 18 + delayed / 10 + inMotion / 24 + blocked / 6);
      const dispatchBottleneck = Math.min(1, delayed / 8 + loading / 14);
      const queueInstability = Math.min(1, delayed / 6 + blocked / 5);
      const saturation = Math.min(1, queuePressure * 0.55 + avgTension * 0.45);
      const confidence = Math.min(1, 0.55 + outboundShipments.length / 120);
      return [
        {
          hubKey,
          hubCode,
          territory,
          label: territory.replace("/", " · "),
          source: "SHIPMENT_TABLE",
          queuePressure: Number(queuePressure.toFixed(3)),
          confidence: Number(confidence.toFixed(3)),
          saturation: Number(saturation.toFixed(3)),
          dispatchBottleneck: Number(dispatchBottleneck.toFixed(3)),
          queueInstability: Number(queueInstability.toFixed(3)),
          inventoryPressure: Number(avgTension.toFixed(3)),
          openDispatchCount,
        },
      ];
    }

    const now = Date.now();
    let dispatch = 0;
    let stuck = 0;
    let prep = 0;
    for (const o of orders) {
      if (o.sellerOrganizationId !== organizationId) continue;
      if (o.status === OrderStatus.CANCELLED) continue;
      if (
        o.status === OrderStatus.ACCEPTED ||
        o.status === OrderStatus.PARTIALLY_ACCEPTED ||
        o.status === OrderStatus.SUBMITTED
      ) {
        dispatch += 1;
      }
      if (o.deliveryStatus === DeliveryStatus.PREPARING) prep += 1;
      if (
        o.status === OrderStatus.ACCEPTED &&
        o.deliveryStatus === DeliveryStatus.NOT_STARTED &&
        now - o.updatedAt.getTime() > 36 * 3600000
      ) {
        stuck += 1;
      }
    }

    if (dispatch === 0 && prep === 0 && stuck === 0 && economicStates.length === 0) {
      return [];
    }

    const queuePressure = Math.min(1, dispatch / 28 + prep / 10);
    const dispatchBottleneck = Math.min(1, stuck / 8 + prep / 12);
    const queueInstability = Math.min(1, stuck / 6 + dispatch / 32);
    const saturation = Math.min(1, dispatch / 35 + prep / 12 + avgTension * 0.45);
    const confidence = Math.min(1, 0.42 + (dispatch + prep > 0 ? 0.18 : 0) + economicStates.length / 200);
    return [
      {
        hubKey,
        hubCode,
        territory,
        label: territory.replace("/", " · "),
        source: "ORDER_PROXY",
        queuePressure: Number(queuePressure.toFixed(3)),
        confidence: Number(confidence.toFixed(3)),
        saturation: Number(saturation.toFixed(3)),
        dispatchBottleneck: Number(dispatchBottleneck.toFixed(3)),
        queueInstability: Number(queueInstability.toFixed(3)),
        inventoryPressure: Number(avgTension.toFixed(3)),
        openDispatchCount: dispatch,
      },
    ];
  }

}
