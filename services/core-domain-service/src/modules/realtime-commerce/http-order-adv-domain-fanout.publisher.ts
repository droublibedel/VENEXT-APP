import { Injectable } from "@nestjs/common";
import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";
import { NoopRealtimeDomainEventPublisher, type OrderAdvDomainSignalPayload } from "./realtime-domain-event.publisher";

/**
 * Instruction 16A — order-adv domain → gateway via {@link DomainRealtimeFanoutClient} (same env as supply/finance).
 */
@Injectable()
export class HttpOrderAdvDomainFanoutPublisher extends NoopRealtimeDomainEventPublisher {
  constructor(private readonly fanout: DomainRealtimeFanoutClient) {
    super();
  }

  override async publishOrderAdvDomainSignal(payload: OrderAdvDomainSignalPayload): Promise<void> {
    await this.fanout.postDomainSignal("/internal/v1/realtime/order-adv/domain-signal", payload as Record<string, unknown>);
  }
}
