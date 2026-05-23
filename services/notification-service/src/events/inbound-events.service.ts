import { Injectable } from "@nestjs/common";
import { parseDomainEventEnvelope } from "@venext/shared-contracts";

@Injectable()
export class InboundEventsService {
  ingest(raw: unknown) {
    const envelope = parseDomainEventEnvelope(raw);
    return { accepted: true, eventType: envelope.eventType };
  }
}
