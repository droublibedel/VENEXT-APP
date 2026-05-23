import { Injectable } from "@nestjs/common";

export type OrderAdvDomainSignalPayload = {
  organizationId: string;
  eventType:
    | "live.order_adv.order.changed"
    | "live.order_adv.negotiation.changed"
    | "live.order_adv.group_buying.changed"
    | "live.order_adv.reservation.changed"
    | "live.order_adv.confirmation.delayed";
  source: "DOMAIN_ANALYSIS" | "DOMAIN_MUTATION";
  body: Record<string, unknown>;
};

/**
 * Bridge for domain → api-gateway realtime (Instruction 9B).
 * Implement with Redis/NATS or HTTP fan-out; core ships a no-op for local dev.
 */
export abstract class RealtimeDomainEventPublisher {
  /**
   * Persisted economic / catalog signals only — channel name `live.economic.signal` at the gateway.
   */
  abstract publishLiveEconomicSignal(payload: {
    channel: "live.economic.signal";
    organizationId?: string;
    body: Record<string, unknown>;
  }): Promise<void>;

  abstract publishLiveRelationshipEvent(payload: { relationshipId: string; event: string }): Promise<void>;
  abstract publishLiveCatalogVisibilityChanged(payload: {
    relationshipId: string;
    productId: string;
  }): Promise<void>;

  /** Instruction 14A — core → gateway fan-out for Orders/ADV (analysis or mutation). */
  abstract publishOrderAdvDomainSignal(payload: OrderAdvDomainSignalPayload): Promise<void>;
}

@Injectable()
export class NoopRealtimeDomainEventPublisher extends RealtimeDomainEventPublisher {
  async publishLiveEconomicSignal(): Promise<void> {}
  async publishLiveRelationshipEvent(): Promise<void> {}
  async publishLiveCatalogVisibilityChanged(): Promise<void> {}
  async publishOrderAdvDomainSignal(_payload: OrderAdvDomainSignalPayload): Promise<void> {}
}
