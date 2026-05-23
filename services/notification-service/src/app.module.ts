import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { InboundEventsModule } from "./events/inbound-events.module";

@Module({
  imports: [InboundEventsModule],
  controllers: [HealthController],
})
export class AppModule {}
