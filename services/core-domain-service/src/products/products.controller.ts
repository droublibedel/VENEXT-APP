import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(
    @Query("organizationId") organizationId?: string,
    @Query("catalogId") catalogId?: string,
    @Query("relationshipId") relationshipId?: string,
  ) {
    if (relationshipId) {
      return this.products.visibilityForRelationship(relationshipId);
    }
    return this.products.findAll({ organizationId, catalogId });
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.products.findOne(id);
  }
}
