import { Module } from "@nestjs/common";
import { CatalogVisibilityResolverService } from "./catalog-visibility-resolver.service";
import { CatalogVisibilityController } from "./catalog-visibility.controller";

@Module({
  controllers: [CatalogVisibilityController],
  providers: [CatalogVisibilityResolverService],
  exports: [CatalogVisibilityResolverService],
})
export class CatalogVisibilityModule {}
