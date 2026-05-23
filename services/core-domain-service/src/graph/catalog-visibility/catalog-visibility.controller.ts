import { Controller, Get, Query, ParseUUIDPipe } from "@nestjs/common";
import { CatalogVisibilityResolverService } from "./catalog-visibility-resolver.service";

@Controller("catalog-visibility-resolver")
export class CatalogVisibilityController {
  constructor(private readonly resolver: CatalogVisibilityResolverService) {}

  @Get("can-view")
  resolve(
    @Query("viewerOrganizationId", ParseUUIDPipe) viewerOrganizationId: string,
    @Query("catalogId", ParseUUIDPipe) catalogId: string,
  ) {
    return this.resolver.canViewCatalog(viewerOrganizationId, catalogId);
  }
}
