import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";

import { CommerceMarketCatalogService } from "./commerce-market-catalog.service";

@Controller("commerce-market-catalog")
export class CommerceMarketCatalogController {
  constructor(private readonly service: CommerceMarketCatalogService) {}

  @Get("catalogue/my-products")
  myProducts(
    @Query("organizationId") organizationId: string,
    @Query("actorRole") actorRole: string,
  ) {
    return this.service.getCatalogueProducts(organizationId, actorRole);
  }

  @Get("market/feed")
  marketFeed(
    @Query("organizationId") organizationId: string,
    @Query("actorRole") actorRole: string,
  ) {
    return this.service.getMarketFeed(organizationId, actorRole);
  }

  @Get("market/product/:id")
  marketProduct(
    @Param("id") id: string,
    @Query("organizationId") organizationId: string,
    @Query("actorRole") actorRole: string,
  ) {
    return this.service.getMarketProduct(organizationId, id, actorRole);
  }

  @Get("catalogue/product/:id")
  catalogueProduct(
    @Param("id") id: string,
    @Query("organizationId") organizationId: string,
    @Query("actorRole") actorRole: string,
  ) {
    return this.service.getCatalogueProduct(organizationId, id, actorRole);
  }

  @Post("market/products/:id/transfer")
  transfer(
    @Param("id") id: string,
    @Body() body: { organizationId: string; actorRole: string; userKey?: string },
  ) {
    return this.service.transferMarketProductToCatalogue(
      body.organizationId,
      id,
      body.actorRole,
      body.userKey,
    );
  }
}
