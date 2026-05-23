import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { OrdersNegotiationModule } from "./orders/orders-negotiation.module";

@Module({
  imports: [OrdersNegotiationModule],
  controllers: [HealthController],
})
export class AppModule {}
