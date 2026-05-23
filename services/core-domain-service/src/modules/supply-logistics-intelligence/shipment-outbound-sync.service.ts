import { Injectable } from "@nestjs/common";
import {
  DeliveryStatus,
  OrderStatus,
  ShipmentHealthStatus,
  ShipmentStatus,
  ShipmentTrackingMode,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

/** Explicit proxy source — never hide order-backed simulation (Instruction 15A). */
export const SHIPMENT_SOURCE_ORDER_PROXY = "ORDERS_AS_SHIPMENT_PROXY" as const;

type OrderRow = {
  id: string;
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  relationshipId: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ShipmentOutboundSyncService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upserts outbound `Shipment` rows for the producer org (seller) from recent orders.
   * Idempotent per `orderId`.
   */
  async syncFromOrders(organizationId: string, orders: OrderRow[], orgGeo: Map<string, string>): Promise<void> {
    const outbound = orders.filter((o) => o.sellerOrganizationId === organizationId && o.status !== OrderStatus.CANCELLED);
    for (const o of outbound) {
      if (o.status === OrderStatus.DRAFT) continue;

      const origin = orgGeo.get(o.sellerOrganizationId) ?? "unknown";
      const destination = orgGeo.get(o.buyerOrganizationId) ?? "unknown";
      const { shipmentStatus, healthStatus } = this.mapExecution(o);

      await this.prisma.shipment.upsert({
        where: { orderId: o.id },
        create: {
          organizationId,
          orderId: o.id,
          relationshipId: o.relationshipId,
          routeCode: `${origin}→${destination}`,
          originTerritory: origin,
          destinationTerritory: destination,
          shipmentStatus,
          healthStatus,
          trackingMode: ShipmentTrackingMode.NONE,
          metadata: { source: SHIPMENT_SOURCE_ORDER_PROXY, orderStatus: o.status, deliveryStatus: o.deliveryStatus },
        },
        update: {
          shipmentStatus,
          healthStatus,
          routeCode: `${origin}→${destination}`,
          originTerritory: origin,
          destinationTerritory: destination,
          metadata: { source: SHIPMENT_SOURCE_ORDER_PROXY, orderStatus: o.status, deliveryStatus: o.deliveryStatus },
        },
      });
    }
  }

  private mapExecution(o: OrderRow): { shipmentStatus: ShipmentStatus; healthStatus: ShipmentHealthStatus } {
    if (o.status === OrderStatus.CANCELLED) {
      return { shipmentStatus: ShipmentStatus.CANCELLED, healthStatus: ShipmentHealthStatus.HEALTHY };
    }
    if (o.deliveryStatus === DeliveryStatus.FAILED) {
      return { shipmentStatus: ShipmentStatus.BLOCKED, healthStatus: ShipmentHealthStatus.CRITICAL };
    }
    if (o.deliveryStatus === DeliveryStatus.DELIVERED && o.status === OrderStatus.COMPLETED) {
      return { shipmentStatus: ShipmentStatus.DELIVERED, healthStatus: ShipmentHealthStatus.HEALTHY };
    }
    const ageMs = Date.now() - o.updatedAt.getTime();
    const delayedMovement = ageMs > 72 * 3600000 && o.status !== OrderStatus.COMPLETED;

    if (o.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY) {
      return {
        shipmentStatus: delayedMovement ? ShipmentStatus.DELAYED : ShipmentStatus.IN_TRANSIT,
        healthStatus: delayedMovement ? ShipmentHealthStatus.UNSTABLE : ShipmentHealthStatus.WATCH,
      };
    }
    if (o.deliveryStatus === DeliveryStatus.PREPARING) {
      return { shipmentStatus: ShipmentStatus.LOADING, healthStatus: ShipmentHealthStatus.WATCH };
    }
    if (o.status === OrderStatus.ACCEPTED && o.deliveryStatus === DeliveryStatus.NOT_STARTED) {
      const stuck = ageMs > 48 * 3600000;
      return {
        shipmentStatus: stuck ? ShipmentStatus.DELAYED : ShipmentStatus.LOADING,
        healthStatus: stuck ? ShipmentHealthStatus.UNSTABLE : ShipmentHealthStatus.WATCH,
      };
    }
    if (o.status === OrderStatus.PARTIALLY_ACCEPTED) {
      return { shipmentStatus: ShipmentStatus.LOADING, healthStatus: ShipmentHealthStatus.WATCH };
    }
    if (o.status === OrderStatus.SUBMITTED) {
      return { shipmentStatus: ShipmentStatus.PLANNED, healthStatus: ShipmentHealthStatus.HEALTHY };
    }
    if (delayedMovement) {
      return { shipmentStatus: ShipmentStatus.DELAYED, healthStatus: ShipmentHealthStatus.UNSTABLE };
    }
    return { shipmentStatus: ShipmentStatus.PLANNED, healthStatus: ShipmentHealthStatus.HEALTHY };
  }
}
