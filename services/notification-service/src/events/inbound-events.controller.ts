import { Body, Controller, Post } from "@nestjs/common";
import { InboundEventsService } from "./inbound-events.service";

/** HTTP bridge for Kafka consumers / sidecars — wire to real consumer later */
@Controller("v1/events")
export class InboundEventsController {
  constructor(private readonly events: InboundEventsService) {}

  @Post("ingest")
  ingest(@Body() body: unknown) {
    return this.events.ingest(body);
  }
}
