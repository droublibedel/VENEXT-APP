import { Injectable } from "@nestjs/common";
import type {
  EdgeLogisticsSyncReadiness,
  LogisticsEdgeFoundationPack,
  LogisticsMovementStrip,
  SupplyOverviewResponse,
} from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { SupplyLogisticsRawSnapshot } from "./supply-logistics-data.service";
import { normalizeTerritoryLabel } from "./territory-code-normalizer";

const EDGE: EdgeLogisticsSyncReadiness = {
  desktopEdgeSync: "PLANNED",
  offlineRouteSync: "PLANNED",
  intermittentConnectivityMode: "SUPPORTED_VIA_ADAPTIVE_UI",
  localRouteCacheSchemaVersion: 1,
  routeTelemetry: {
    status: "NOT_CONFIGURED",
    note: "No GPS / route telemetry ingested — corridor keys are org-territory derived (Instruction 15).",
  },
};

const LOGISTICS_EDGE_FOUNDATION: LogisticsEdgeFoundationPack = {
  routeTelemetryIngest: {
    schemaVersion: 1,
    status: "NOT_CONFIGURED",
    allowedPayloadKinds: ["GPS_POINT_BATCH", "CORRIDOR_DWELL", "HUB_DOCK_EVENT"],
    note: "Ingestion contract only — no WGS84 payloads accepted yet (Instruction 15A).",
  },
  edgeSyncShipmentCache: {
    schemaVersion: 1,
    maxCachedShipments: 500,
    evictionPolicy: "PRIORITY_SCORE",
    note: "Future desktop-edge shipment cache — schema reserved.",
  },
  offlineRouteEventQueue: {
    schemaVersion: 1,
    maxQueuedEvents: 2000,
    durable: true,
    note: "Future offline route event queue — durable replay contract reserved.",
  },
  futureGpsUpdatePayload: {
    schemaVersion: 1,
    trackingMode: "GPS_FUTURE",
    payloadShape: "DEFERRED",
    note: "GPS telemetry placeholder — do not emit fake tracks (Instruction 15A).",
  },
};

/** Instruction 15A — DRAFT is not movement; COMPLETED + DELIVERED is closed. */
export function isActiveShipmentProxy(o: {
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
}): boolean {
  if (o.status === OrderStatus.CANCELLED) return false;
  if (o.status === OrderStatus.DRAFT) return false;
  if (o.status === OrderStatus.COMPLETED && o.deliveryStatus === DeliveryStatus.DELIVERED) return false;
  return true;
}

const ACTIVE_SHIPMENT_PROXY_SEMANTICS =
  "Active shipment proxy counts orders in movement: SUBMITTED, ACCEPTED, PARTIALLY_ACCEPTED, and non-terminal states; DRAFT excluded; COMPLETED excluded when delivery is DELIVERED (Instruction 15A).";

@Injectable()
export class SupplyOverviewService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): SupplyOverviewResponse {
    const { organizationId, generatedAt, orders, orgGeo, groupSessions, economicStates, economicSignals, deliveryMessageVolume } =
      snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        activeShipments: 0,
        delayedShipments: 0,
        unstableTerritories: 0,
        routeCongestionIndex: 0,
        warehousePressureIndex: 0,
        loadingDelayIndex: 0,
        fulfillmentConfidence: 0,
        downstreamSupplyQuality: 0,
        territoryInstability: 0,
        routeExecutionConfidence: 0,
        movementStrips: [],
        edgeReadiness: EDGE,
        engineNote: "supply_logistics_enabled",
      };
    }

    const activeShipments = orders.filter((o) => isActiveShipmentProxy(o)).length;
    const now = Date.now();
    const delayedShipments = orders.filter((o) => {
      if (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED) return false;
      return now - o.updatedAt.getTime() > 72 * 3600000;
    }).length;

    const blocked = orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED).length;
    const inFlight = orders.filter(
      (o) => o.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY || o.deliveryStatus === DeliveryStatus.PREPARING,
    ).length;

    const territoryKey = (orgId: string) => {
      const raw = orgGeo.get(orgId) ?? "";
      const n = normalizeTerritoryLabel(raw);
      return n.normalizedCode !== "UNKNOWN" ? n.normalizedCode : raw || "unknown";
    };

    const byTerritory = new Map<string, { orders: number; failed: number; delayed: number }>();
    const bump = (oid: string, field: "orders" | "failed" | "delayed") => {
      const k = territoryKey(oid);
      const cur = byTerritory.get(k) ?? { orders: 0, failed: 0, delayed: 0 };
      cur[field] += 1;
      byTerritory.set(k, cur);
    };
    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      bump(o.buyerOrganizationId, "orders");
      if (o.deliveryStatus === DeliveryStatus.FAILED) bump(o.buyerOrganizationId, "failed");
      if (now - o.updatedAt.getTime() > 72 * 3600000 && o.status !== OrderStatus.COMPLETED) bump(o.buyerOrganizationId, "delayed");
    }
    let unstableTerritories = 0;
    for (const [, v] of byTerritory) {
      const p = Math.min(1, v.orders / 14 + v.failed / 4 + v.delayed / 6);
      if (p > 0.48) unstableTerritories += 1;
    }

    const corridorLoads = new Map<string, number>();
    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      const a = normalizeTerritoryLabel(orgGeo.get(o.sellerOrganizationId) ?? "?").normalizedCode;
      const b = normalizeTerritoryLabel(orgGeo.get(o.buyerOrganizationId) ?? "?").normalizedCode;
      const ck = `${a}→${b}`;
      corridorLoads.set(ck, (corridorLoads.get(ck) ?? 0) + 1);
    }
    const maxCorridor = Math.max(0, ...corridorLoads.values());
    const routeCongestionIndex = Math.min(1, maxCorridor / 22 + blocked / 10);

    const hubPressure = orders.filter((o) => o.sellerOrganizationId === organizationId && isActiveShipmentProxy(o)).length;
    const stockT = economicStates.reduce((s, e) => s + e.stockTensionLevel, 0) / Math.max(1, economicStates.length);
    const warehousePressureIndex = Math.min(1, hubPressure / 35 + stockT * 0.45 + groupSessions.length / 14);

    const loadingStuck = orders.filter(
      (o) =>
        o.status === OrderStatus.ACCEPTED &&
        o.deliveryStatus === DeliveryStatus.NOT_STARTED &&
        now - o.updatedAt.getTime() > 24 * 3600000,
    ).length;
    const loadingDelayIndex = Math.min(1, loadingStuck / 12 + deliveryMessageVolume / 320);

    const completed = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const fulfillmentConfidence = Math.min(
      1,
      0.38 + (completed / Math.max(10, orders.length)) * 0.42 - delayedShipments * 0.025 - blocked * 0.04,
    );

    const zoneStress = economicSignals.filter((s) => s.zoneCode && s.intensityScore > 0.55).length;
    const downstreamSupplyQuality = Math.min(
      1,
      0.5 + economicStates.reduce((s, e) => s + Math.min(1, e.recentOrderCount / 8), 0) / Math.max(6, economicStates.length) * 0.2 - zoneStress * 0.03,
    );

    const territoryInstability = Math.min(1, unstableTerritories / 8 + routeCongestionIndex * 0.35);
    const routeExecutionConfidence = Math.min(1, 0.55 + inFlight / Math.max(8, orders.length) * 0.25 - routeCongestionIndex * 0.3);

    const strips: LogisticsMovementStrip[] = [
      {
        id: "mv-corridor",
        band: "corridor",
        tension: Number(routeCongestionIndex.toFixed(3)),
        vector: routeCongestionIndex > 0.52 ? "compress" : "pulse",
        label: "Corridor load — shipment density vs failure mass",
      },
      {
        id: "mv-hub",
        band: "warehouse",
        tension: Number(warehousePressureIndex.toFixed(3)),
        vector: warehousePressureIndex > 0.55 ? "compress" : "lateral",
        label: "Hub saturation — dispatch queue × stock tension",
      },
      {
        id: "mv-loading",
        band: "dock",
        tension: Number(loadingDelayIndex.toFixed(3)),
        vector: loadingDelayIndex > 0.45 ? "compress" : "pulse",
        label: "Loading / execution dwell — accepted-not-dispatched envelope",
      },
    ];

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      activeShipments,
      delayedShipments,
      unstableTerritories,
      routeCongestionIndex: Number(routeCongestionIndex.toFixed(3)),
      warehousePressureIndex: Number(warehousePressureIndex.toFixed(3)),
      loadingDelayIndex: Number(loadingDelayIndex.toFixed(3)),
      fulfillmentConfidence: Number(fulfillmentConfidence.toFixed(3)),
      downstreamSupplyQuality: Number(downstreamSupplyQuality.toFixed(3)),
      territoryInstability: Number(territoryInstability.toFixed(3)),
      routeExecutionConfidence: Number(routeExecutionConfidence.toFixed(3)),
      movementStrips: strips,
      edgeReadiness: EDGE,
      logisticsEdgeFoundation: LOGISTICS_EDGE_FOUNDATION,
      activeShipmentProxySemantics: ACTIVE_SHIPMENT_PROXY_SEMANTICS,
      engineNote:
        "Orders + delivery states + economic signals — movement supervision, not ERP rows. Territory keys normalized (Instruction 15A).",
    };
  }
}
