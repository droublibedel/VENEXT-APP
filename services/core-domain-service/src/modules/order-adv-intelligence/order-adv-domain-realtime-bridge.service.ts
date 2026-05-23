import { Injectable } from "@nestjs/common";
import type {
  DeliveryPriorityResponse,
  GroupBuyingSupervisionResponse,
  NegotiationIntelligenceResponse,
  OrdersOverviewResponse,
  ReservationAllocationResponse,
} from "@venext/shared-contracts";
import { RealtimeDomainEventPublisher } from "../realtime-commerce/realtime-domain-event.publisher";
import type { OrderAdvRawSnapshot } from "./order-adv-data.service";

/**
 * Publishes minimal domain-analysis signals after read-model builds (Instruction 14A).
 * Throttled per organization to avoid duplicate noise on rapid refreshes.
 */
@Injectable()
export class OrderAdvDomainRealtimeBridgeService {
  private readonly lastEmit = new Map<string, number>();

  constructor(private readonly publisher: RealtimeDomainEventPublisher) {}

  maybePublishAfterRead(
    organizationId: string,
    snapshot: OrderAdvRawSnapshot,
    ctx: {
      overview: OrdersOverviewResponse;
      negotiations: NegotiationIntelligenceResponse;
      groupBuying: GroupBuyingSupervisionResponse;
      reservations: ReservationAllocationResponse;
      delivery: DeliveryPriorityResponse;
    },
  ): void {
    const now = Date.now();
    const last = this.lastEmit.get(organizationId) ?? 0;
    if (now - last < 5000) return;
    this.lastEmit.set(organizationId, now);

    const { overview, negotiations, groupBuying, reservations, delivery } = ctx;
    const tasks: Promise<void>[] = [];

    if (overview.delayedOrders > 4) {
      tasks.push(
        this.publisher.publishOrderAdvDomainSignal({
          organizationId,
          eventType: "live.order_adv.confirmation.delayed",
          source: "DOMAIN_ANALYSIS",
          body: { delayedOrders: overview.delayedOrders, generatedAt: snapshot.generatedAt },
        }),
      );
    }

    const openNegShape = negotiations.negotiationBursts24h > 10 || negotiations.unstableNegotiations > 5;
    if (openNegShape || overview.negotiationIntensity > 0.55) {
      tasks.push(
        this.publisher.publishOrderAdvDomainSignal({
          organizationId,
          eventType: "live.order_adv.negotiation.changed",
          source: "DOMAIN_ANALYSIS",
          body: {
            unstableNegotiations: negotiations.unstableNegotiations,
            negotiationBursts24h: negotiations.negotiationBursts24h,
            negotiationIntensity: overview.negotiationIntensity,
          },
        }),
      );
    }

    const stalledGb = groupBuying.rows.filter((r) => r.velocityHint === "stalled").length;
    const surgeGb = groupBuying.rows.filter((r) => r.velocityHint === "surge").length;
    if (stalledGb > 1 || surgeGb > 3 || overview.groupedBuyingActivity > 0.52) {
      tasks.push(
        this.publisher.publishOrderAdvDomainSignal({
          organizationId,
          eventType: "live.order_adv.group_buying.changed",
          source: "DOMAIN_ANALYSIS",
          body: { stalledGb, surgeGb, activeSessions: groupBuying.activeSessions },
        }),
      );
    }

    const intentPressure = snapshot.reservationIntents.length;
    const resRows = reservations.rows.filter((r) => (r.intentReservedUnits ?? 0) > 0 || r.allocationConflictScore > 0.5).length;
    if (overview.reservationPressure > 0.48 || intentPressure > 0 || resRows > 0) {
      tasks.push(
        this.publisher.publishOrderAdvDomainSignal({
          organizationId,
          eventType: "live.order_adv.reservation.changed",
          source: "DOMAIN_ANALYSIS",
          body: { reservationPressure: overview.reservationPressure, intentRows: intentPressure, conflictRows: resRows },
        }),
      );
    }

    if (delivery.fulfillmentInstability > 0.45 || delivery.blockedDeliveries > 0 || overview.deliveryTension > 0.5) {
      tasks.push(
        this.publisher.publishOrderAdvDomainSignal({
          organizationId,
          eventType: "live.order_adv.order.changed",
          source: "DOMAIN_ANALYSIS",
          body: {
            blockedDeliveries: delivery.blockedDeliveries,
            fulfillmentInstability: delivery.fulfillmentInstability,
            deliveryTension: overview.deliveryTension,
          },
        }),
      );
    }

    void Promise.all(tasks);
  }
}
