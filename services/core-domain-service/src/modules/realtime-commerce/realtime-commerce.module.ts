import { Module } from "@nestjs/common";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { HttpOrderAdvDomainFanoutPublisher } from "./http-order-adv-domain-fanout.publisher";
import { RealtimeDomainEventPublisher } from "./realtime-domain-event.publisher";

/**
 * Instruction 7 §17 — realtime commerce contract boundary.
 * Instruction 16A — `RealtimeDomainEventPublisher` uses shared internal gateway env (see `DomainRealtimeFanoutClient`).
 */
@Module({
  imports: [DomainRealtimeModule],
  providers: [
    HttpOrderAdvDomainFanoutPublisher,
    { provide: RealtimeDomainEventPublisher, useExisting: HttpOrderAdvDomainFanoutPublisher },
  ],
  exports: [RealtimeDomainEventPublisher],
})
export class RealtimeCommerceModule {}
