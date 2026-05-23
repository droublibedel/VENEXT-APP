import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { NegotiationsService } from "./negotiations.service";

@Controller("negotiations")
export class NegotiationsController {
  constructor(private readonly neg: NegotiationsService) {}

  @Get()
  list(
    @Query("productId") productId?: string,
    @Query("buyerOrganizationId") buyerOrganizationId?: string,
    @Query("sellerOrganizationId") sellerOrganizationId?: string,
  ) {
    return this.neg.findAll({
      productId,
      buyerOrganizationId,
      sellerOrganizationId,
    });
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.neg.findOne(id);
  }
}
