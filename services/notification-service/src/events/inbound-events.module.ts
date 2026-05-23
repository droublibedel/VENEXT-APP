import { Module } from "@nestjs/common";
import { InboundEventsController } from "./inbound-events.controller";
import { InboundEventsService } from "./inbound-events.service";

@Module({
  controllers: [InboundEventsController],
  providers: [InboundEventsService],
})
export class InboundEventsModule {}
