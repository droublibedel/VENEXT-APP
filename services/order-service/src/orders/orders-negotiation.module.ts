import { Module } from "@nestjs/common";
import { OrdersNegotiationController } from "./orders-negotiation.controller";

@Module({
  controllers: [OrdersNegotiationController],
})
export class OrdersNegotiationModule {}
