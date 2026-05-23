import { Controller, Get } from "@nestjs/common";

@Controller("v1/orders")
export class OrdersNegotiationController {
  @Get("foundation")
  foundation() {
    return { negotiation: "paired_with_orders", persistence: "orders+negotiations" };
  }
}
