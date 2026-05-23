import { Injectable } from "@nestjs/common";
import type { DeliveryPriorityResponse, DeliveryPriorityRow } from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";

@Injectable()
export class DeliveryPriorityService {
  build(snapshot: OrderAdvRawSnapshot, enabled: boolean): DeliveryPriorityResponse {
    const { organizationId, generatedAt, orders } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        urgentDeliveries: 0,
        blockedDeliveries: 0,
        fulfillmentInstability: 0,
        rows: [],
      };
    }

    const active = orders.filter((o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED);
    const rows: DeliveryPriorityRow[] = active.slice(0, 36).map((o) => {
      const lagH = (o.updatedAt.getTime() - o.createdAt.getTime()) / 3600000;
      const blocked = o.deliveryStatus === DeliveryStatus.FAILED;
      const urgent =
        o.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY || (o.status === OrderStatus.ACCEPTED && lagH > 72);
      const priorityScore = Math.min(
        1,
        (urgent ? 0.35 : 0) + (blocked ? 0.45 : 0) + lagH / 200 + (o.paymentStatus === PaymentStatus.UNPAID ? 0.12 : 0),
      );
      return {
        orderId: o.id,
        priorityScore: Number(priorityScore.toFixed(3)),
        deliveryStatus: o.deliveryStatus,
        blocked,
        confirmationLagHours: Number(lagH.toFixed(2)),
        congestionHint: blocked ? "fulfillment_failure_lane" : urgent ? "downstream_acceleration" : "stable_execution",
      };
    });

    const urgentDeliveries = rows.filter((r) => r.priorityScore > 0.55 && !r.blocked).length;
    const blockedDeliveries = rows.filter((r) => r.blocked).length;
    const fulfillmentInstability = Math.min(1, blockedDeliveries / 6 + urgentDeliveries / 15);

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      urgentDeliveries,
      blockedDeliveries,
      fulfillmentInstability: Number(fulfillmentInstability.toFixed(3)),
      rows,
    };
  }
}
