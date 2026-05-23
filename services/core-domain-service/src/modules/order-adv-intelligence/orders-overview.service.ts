import { Injectable } from "@nestjs/common";
import type { OrdersOverviewResponse, TransactionSignalStrip } from "@venext/shared-contracts";
import { DeliveryStatus, GroupBuyingStatus, NegotiationStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import type { OrderAdvRawSnapshot } from "./order-adv-data.service";

@Injectable()
export class OrdersOverviewService {
  build(snapshot: OrderAdvRawSnapshot, enabled: boolean): OrdersOverviewResponse {
    const { organizationId, generatedAt, orders, negotiations, threads, groupSessions, economicStates } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        activeOrders: 0,
        delayedOrders: 0,
        negotiationIntensity: 0,
        groupedBuyingActivity: 0,
        reservationPressure: 0,
        deliveryTension: 0,
        retailerDemandAcceleration: 0,
        transactionConfidence: 0,
        conversationalCommerceIntensity: 0,
        signalStrips: [],
        engineNote: "order_adv_enabled",
      };
    }

    const activeStatuses = new Set<OrderStatus>([
      OrderStatus.DRAFT,
      OrderStatus.SUBMITTED,
      OrderStatus.ACCEPTED,
      OrderStatus.PARTIALLY_ACCEPTED,
    ]);
    const activeOrders = orders.filter((o) => activeStatuses.has(o.status)).length;
    const now = Date.now();
    const delayedOrders = orders.filter((o) => {
      if (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED) return false;
      return now - o.updatedAt.getTime() > 72 * 3600000;
    }).length;

    const openNegs = negotiations.filter((n) => n.status === NegotiationStatus.OPEN || n.status === NegotiationStatus.PROPOSED).length;
    const negotiationIntensity = Math.min(1, openNegs / 25 + negotiations.length / 120);

    const openGb = groupSessions.filter((g) => g.status === GroupBuyingStatus.OPEN).length;
    const groupedBuyingActivity = Math.min(1, openGb / 8 + groupSessions.length / 40);

    const draftHeavy = orders.filter((o) => o.status === OrderStatus.DRAFT).length;
    const reservationPressure = Math.min(1, draftHeavy / 20 + economicStates.reduce((s, e) => s + e.stockTensionLevel, 0) / Math.max(1, economicStates.length * 2));

    const delTense = orders.filter(
      (o) => o.deliveryStatus === DeliveryStatus.FAILED || o.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY,
    ).length;
    const deliveryTension = Math.min(
      1,
      delTense / 15 +
        orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID && o.status !== OrderStatus.DRAFT).length / 40,
    );

    const retailerDemandAcceleration = Math.min(1, economicStates.reduce((s, e) => s + e.demandVelocity, 0) / Math.max(8, economicStates.length));

    const transactionConfidence = Math.min(
      1,
      0.45 +
        (orders.filter((o) => o.status === OrderStatus.COMPLETED).length / Math.max(8, orders.length)) * 0.35 -
        delayedOrders * 0.02,
    );

    const msgThreads = threads.length;
    const msgVol = [...snapshot.messageCountByThread.values()].reduce((a, b) => a + b, 0);
    const conversationalCommerceIntensity = Math.min(1, msgThreads / 35 + msgVol / 400);

    const strips: TransactionSignalStrip[] = [
      {
        id: "strip-neg",
        band: "negotiation",
        tension: Number(negotiationIntensity.toFixed(3)),
        vector: negotiationIntensity > 0.55 ? "compress" : "pulse",
        label: "Negotiation gradient — open / proposed envelope",
      },
      {
        id: "strip-del",
        band: "fulfillment",
        tension: Number(deliveryTension.toFixed(3)),
        vector: deliveryTension > 0.5 ? "compress" : "lateral",
        label: "Delivery tension — execution lane heat",
      },
      {
        id: "strip-conv",
        band: "conversational",
        tension: Number(conversationalCommerceIntensity.toFixed(3)),
        vector: "pulse",
        label: "Commerce-native messaging density (threads × velocity)",
      },
    ];

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      activeOrders,
      delayedOrders,
      negotiationIntensity: Number(negotiationIntensity.toFixed(3)),
      groupedBuyingActivity: Number(groupedBuyingActivity.toFixed(3)),
      reservationPressure: Number(reservationPressure.toFixed(3)),
      deliveryTension: Number(deliveryTension.toFixed(3)),
      retailerDemandAcceleration: Number(retailerDemandAcceleration.toFixed(3)),
      transactionConfidence: Number(Math.max(0.08, transactionConfidence).toFixed(3)),
      conversationalCommerceIntensity: Number(conversationalCommerceIntensity.toFixed(3)),
      signalStrips: strips,
      engineNote: "VENEXT_ORDER_ADV_OVERVIEW_V1",
    };
  }
}
