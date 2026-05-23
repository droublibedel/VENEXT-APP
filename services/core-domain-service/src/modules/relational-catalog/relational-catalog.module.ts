import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommercialRelationshipGraphModule } from "../commercial-relationship-graph/commercial-relationship-graph.module";
import { RelationalCatalogAccessService } from "./relational-catalog-access.service";
import { RelationalCatalogController } from "./relational-catalog.controller";
import { RelationalCatalogRealtimePublishService } from "./relational-catalog-realtime-publish.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, CommercialRelationshipGraphModule],
  controllers: [RelationalCatalogController],
  providers: [RelationalCatalogAccessService, RelationalCatalogRealtimePublishService],
  exports: [RelationalCatalogAccessService],
})
export class RelationalCatalogModule {}
