import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { MessagingContextModule } from "./messaging/messaging-context.module";

@Module({
  imports: [MessagingContextModule],
  controllers: [HealthController],
})
export class AppModule {}
