import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @Query("buyerOrganizationId") buyerOrganizationId?: string,
    @Query("sellerOrganizationId") sellerOrganizationId?: string,
  ) {
    return this.orders.findAll({ buyerOrganizationId, sellerOrganizationId });
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.orders.findOne(id);
  }
}
